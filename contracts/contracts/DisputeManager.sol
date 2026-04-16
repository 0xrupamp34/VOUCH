// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IDisputeManager, Dispute, JurorStake, Vote, DisputeStatus, DisputeResolution } from "../interfaces/IDisputeManager.sol";
import { ITaskEscrow } from "../interfaces/ITaskEscrow.sol";
import { IReputationEngine } from "../interfaces/IReputationEngine.sol";
import { IAgentRegistry } from "../interfaces/IAgentRegistry.sol";

contract DisputeManager is IDisputeManager, ReentrancyGuard {

    uint256 public constant JURY_SIZE = 7;
    uint256 public constant MIN_JUROR_STAKE = 100e18;
    uint256 public constant JUROR_REWARD_MULTIPLIER = 150;
    uint256 public constant QUORUM_PERCENTAGE = 71;

    uint64 public evidenceWindowDuration = 48 hours;
    uint64 public votingWindowDuration = 72 hours;

    IAgentRegistry public agentRegistry;
    IReputationEngine public reputationEngine;
    ITaskEscrow public taskEscrow;
    address public vouchToken;
    address public governance;

    mapping(bytes32 => Dispute) public disputes;
    mapping(bytes32 => address[]) public disputeJuries;
    mapping(bytes32 => mapping(address => JurorStake)) public jurorStakes;
    mapping(bytes32 => mapping(address => Vote)) public votes;
    mapping(bytes32 => mapping(address => bool)) public isJuror;
    mapping(bytes32 => uint256) private _disputeNonce;

    modifier onlyOpenDispute(bytes32 disputeId) {
        if (disputes[disputeId].disputeId != disputeId) revert DisputeNotFound(disputeId);
        if (disputes[disputeId].status != DisputeStatus.OPEN && 
            disputes[disputeId].status != DisputeStatus.UNDER_REVIEW) {
            revert InvalidStatus(disputes[disputeId].status, DisputeStatus.OPEN);
        }
        _;
    }

    modifier onlyEvidenceWindow(bytes32 disputeId) {
        if (block.timestamp > disputes[disputeId].evidenceDeadline) {
            revert EvidenceWindowClosed();
        }
        _;
    }

    modifier onlyVotingWindow(bytes32 disputeId) {
        Dispute storage dispute = disputes[disputeId];
        if (block.timestamp < dispute.evidenceDeadline || block.timestamp > dispute.votingDeadline) {
            revert VotingWindowClosed();
        }
        _;
    }

    constructor(
        address _agentRegistry,
        address _reputationEngine,
        address _taskEscrow,
        address _vouchToken
    ) {
        agentRegistry = IAgentRegistry(_agentRegistry);
        reputationEngine = IReputationEngine(_reputationEngine);
        taskEscrow = ITaskEscrow(_taskEscrow);
        vouchToken = _vouchToken;
    }

    function createDispute(
        bytes32 taskId,
        string calldata reason
    ) external nonReentrant returns (bytes32 disputeId) {
        (, DisputeStatus taskStatus) = _getTaskStatus(taskId);
        require(taskStatus == DisputeStatus.OPEN || taskStatus == DisputeStatus.VERIFIED || 
                taskStatus == DisputeStatus.FAILED, "Task not disputable");

        disputeId = keccak256(abi.encodePacked(taskId, _disputeNonce++));

        Dispute storage dispute = disputes[disputeId];
        dispute.disputeId = disputeId;
        dispute.taskId = taskId;
        dispute.raisedBy = msg.sender;
        dispute.status = DisputeStatus.OPEN;
        dispute.reason = reason;
        dispute.createdAt = uint64(block.timestamp);
        dispute.evidenceDeadline = uint64(block.timestamp) + evidenceWindowDuration;
        dispute.votingDeadline = dispute.evidenceDeadline + votingWindowDuration;

        emit DisputeCreated(disputeId, taskId, msg.sender, dispute.evidenceDeadline, dispute.votingDeadline);
    }

    function submitEvidence(
        bytes32 disputeId,
        bytes32 evidenceHash,
        string calldata description
    ) external nonReentrant onlyOpenDispute(disputeId) onlyEvidenceWindow(disputeId) {
        Dispute storage dispute = disputes[disputeId];

        require(
            msg.sender == _getTaskPoster(dispute.taskId) || 
            msg.sender == _getAgentOperator(dispute.taskId),
            "Not authorized to submit evidence"
        );

        dispute.status = DisputeStatus.UNDER_REVIEW;

        emit EvidenceSubmitted(disputeId, msg.sender, evidenceHash);
    }

    function selectJury(bytes32 disputeId) 
        external 
        onlyOpenDispute(disputeId) 
        returns (address[] memory jurors) 
    {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.UNDER_REVIEW, "Must be under review");
        require(disputeJuries[disputeId].length == 0, "Jury already selected");

        dispute.status = DisputeStatus.VOTING;
        jurors = _selectRandomJurors(disputeId, JURY_SIZE);
        disputeJuries[disputeId] = jurors;

        for (uint256 i = 0; i < jurors.length; i++) {
            isJuror[disputeId][jurors[i]] = true;
            jurorStakes[disputeId][jurors[i]] = JurorStake({
                juror: jurors[i],
                amount: MIN_JUROR_STAKE,
                lockedUntil: dispute.votingDeadline + 1 days,
                rewarded: false,
                penalized: false
            });
        }

        emit JurySelected(disputeId, jurors);
    }

    function castVote(
        bytes32 disputeId,
        DisputeResolution decision,
        string calldata reasoning
    ) external nonReentrant onlyVotingWindow(disputeId) {
        Dispute storage dispute = disputes[disputeId];
        require(isJuror[disputeId][msg.sender], "Not a selected juror");
        require(!votes[disputeId][msg.sender].voted, "Already voted");

        votes[disputeId][msg.sender] = Vote({
            juror: msg.sender,
            decision: decision,
            reasoning: reasoning,
            staked: jurorStakes[disputeId][msg.sender].amount,
            votedAt: uint64(block.timestamp)
        });

        emit VoteCast(disputeId, msg.sender, decision);
    }

    function resolveDispute(bytes32 disputeId) external nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.VOTING, "Not in voting");
        require(block.timestamp > dispute.votingDeadline, "Voting not ended");

        address[] memory jurors = disputeJuries[disputeId];
        uint256 voteCount = jurors.length;
        require(voteCount >= (JURY_SIZE * QUORUM_PERCENTAGE) / 100, "Quorum not reached");

        uint256 forAgent = 0;
        uint256 forPoster = 0;
        uint256 split = 0;

        for (uint256 i = 0; i < voteCount; i++) {
            Vote memory vote = votes[disputeId][jurors[i]];
            if (vote.decision == DisputeResolution.AGENT_WINS) {
                forAgent++;
            } else if (vote.decision == DisputeResolution.POSTER_WINS) {
                forPoster++;
            } else {
                split++;
            }
        }

        DisputeResolution resolution;
        uint256 agentPayout;
        int256 scoreDelta;

        if (forAgent > forPoster && forAgent > split) {
            resolution = DisputeResolution.AGENT_WINS;
        } else if (forPoster > forAgent && forPoster > split) {
            resolution = DisputeResolution.POSTER_WINS;
        } else {
            resolution = DisputeResolution.SPLIT;
        }

        _executeResolution(disputeId, resolution, agentPayout, scoreDelta);

        _distributeJurorRewards(disputeId, resolution);

        dispute.status = DisputeStatus.RESOLVED;
        dispute.resolution = resolution;
        dispute.agentPayout = agentPayout;
        dispute.scoreDelta = scoreDelta;
        dispute.resolvedAt = uint64(block.timestamp);

        emit DisputeResolved(disputeId, resolution, agentPayout, scoreDelta);
    }

    function cancelDispute(bytes32 disputeId) external nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.raisedBy == msg.sender, "Not dispute creator");
        require(dispute.status == DisputeStatus.OPEN, "Cannot cancel");

        dispute.status = DisputeStatus.CANCELLED;
    }

    function appealDispute(bytes32 disputeId, string calldata reason) external nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.RESOLVED, "Not resolved");
        require(
            msg.sender == _getTaskPoster(dispute.taskId) ||
            msg.sender == _getAgentOperator(dispute.taskId),
            "Not authorized"
        );

        dispute.status = DisputeStatus.APPEALED;
    }

    function _executeResolution(
        bytes32 disputeId,
        DisputeResolution resolution,
        uint256 agentPayout,
        int256 scoreDelta
    ) internal {
        Dispute storage dispute = disputes[disputeId];
        Task memory task = taskEscrow.getTask(dispute.taskId);

        if (resolution == DisputeResolution.AGENT_WINS) {
            agentPayout = task.amount;
            scoreDelta = 25e18;
        } else if (resolution == DisputeResolution.POSTER_WINS) {
            agentPayout = 0;
            scoreDelta = -100e18;
        } else {
            uint256 splitAmount = (task.amount * 60) / 100;
            agentPayout = task.amount - splitAmount;
            scoreDelta = 0;
        }

        taskEscrow.resolveDispute(dispute.taskId, uint8(resolution), agentPayout, scoreDelta);

        if (scoreDelta != 0) {
            reputationEngine.applyDisputeOutcome(task.agentId, scoreDelta, "dispute_resolution");
        }
    }

    function _distributeJurorRewards(bytes32 disputeId, DisputeResolution resolution) internal {
        address[] memory jurors = disputeJuries[disputeId];

        for (uint256 i = 0; i < jurors.length; i++) {
            address juror = jurors[i];
            Vote memory vote = votes[disputeId][msg.sender];
            JurorStake storage stake = jurorStakes[disputeId][juror];

            bool votedWithMajority = _votedWithMajority(vote.decision, resolution);

            if (votedWithMajority) {
                uint256 reward = (stake.amount * JUROR_REWARD_MULTIPLIER) / 100;
                stake.rewarded = true;
                emit RewardDistributed(disputeId, juror, reward);
            } else {
                stake.penalized = true;
            }
        }
    }

    function _votedWithMajority(
        DisputeResolution voterDecision,
        DisputeResolution majorityDecision
    ) internal pure returns (bool) {
        return voterDecision == majorityDecision;
    }

    function _selectRandomJurors(bytes32 disputeId, uint256 count) 
        internal 
        view 
        returns (address[] memory) 
    {
        address[] memory jurors = new address[](count);
        uint256 selected = 0;
        uint256 totalAgents = agentRegistry.getAgentCount();
        
        uint256 nonce = uint256(keccak256(abi.encodePacked(
            disputeId, 
            block.timestamp, 
            block.prevrandao
        )));

        while (selected < count && selected < totalAgents) {
            uint256 index = uint256(keccak256(abi.encodePacked(nonce, selected))) % totalAgents;
            address potentialJuror = agentRegistry.getAgent(index + 1).operator;

            if (potentialJuror != address(0) && !_isJurorSelected(jurors, potentialJuror)) {
                jurors[selected] = potentialJuror;
                selected++;
            }
            nonce++;
        }

        return jurors;
    }

    function _isJurorSelected(address[] memory jurors, address juror) 
        internal 
        pure 
        returns (bool) 
    {
        for (uint256 i = 0; i < jurors.length; i++) {
            if (jurors[i] == juror) return true;
        }
        return false;
    }

    function _getTaskStatus(bytes32 taskId) internal view returns (Task memory task, DisputeStatus status) {
        task = taskEscrow.getTask(taskId);
        status = DisputeStatus(task.status);
    }

    function _getTaskPoster(bytes32 taskId) internal view returns (address) {
        return taskEscrow.getTask(taskId).poster;
    }

    function _getAgentOperator(bytes32 taskId) internal view returns (address) {
        uint256 agentId = taskEscrow.getTask(taskId).agentId;
        return agentRegistry.getAgent(agentId).operator;
    }

    function getDispute(bytes32 disputeId) external view returns (Dispute memory) {
        return disputes[disputeId];
    }

    function getDisputeStatus(bytes32 disputeId) external view returns (DisputeStatus) {
        return disputes[disputeId].status;
    }

    function getJury(bytes32 disputeId) external view returns (address[] memory) {
        return disputeJuries[disputeId];
    }

    function getVote(bytes32 disputeId, address juror) external view returns (Vote memory) {
        return votes[disputeId][juror];
    }

    function getVoteCount(bytes32 disputeId) 
        external 
        view 
        returns (uint256 forAgent, uint256 forPoster, uint256 split) 
    {
        address[] memory jurors = disputeJuries[disputeId];
        for (uint256 i = 0; i < jurors.length; i++) {
            Vote memory vote = votes[disputeId][jurors[i]];
            if (vote.voted) {
                if (vote.decision == DisputeResolution.AGENT_WINS) {
                    forAgent++;
                } else if (vote.decision == DisputeResolution.POSTER_WINS) {
                    forPoster++;
                } else {
                    split++;
                }
            }
        }
    }

    function hasVoted(bytes32 disputeId, address juror) external view returns (bool) {
        return votes[disputeId][juror].voted;
    }

    function getJurorStake(bytes32 disputeId, address juror) external view returns (JurorStake memory) {
        return jurorStakes[disputeId][juror];
    }

    function setGovernance(address _governance) external {
        require(governance == address(0), "Already set");
        governance = _governance;
    }
}
