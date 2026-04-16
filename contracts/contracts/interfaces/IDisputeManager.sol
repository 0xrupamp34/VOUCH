// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum DisputeStatus {
    OPEN,
    UNDER_REVIEW,
    EVIDENCE_SUBMISSION,
    VOTING,
    RESOLVED,
    APPEALED,
    CANCELLED
}

enum DisputeResolution {
    AGENT_WINS,
    POSTER_WINS,
    SPLIT,
    NEGOTIATED
}

struct Dispute {
    bytes32 disputeId;
    bytes32 taskId;
    address raisedBy;
    DisputeStatus status;
    DisputeResolution resolution;
    uint256 agentPayout;
    int256 scoreDelta;
    uint64 createdAt;
    uint64 evidenceDeadline;
    uint64 votingDeadline;
    uint64 resolvedAt;
    string reason;
    string resolutionNotes;
}

struct JurorStake {
    address juror;
    uint256 amount;
    uint256 lockedUntil;
    bool rewarded;
    bool penalized;
}

struct Vote {
    address juror;
    DisputeResolution decision;
    string reasoning;
    uint256 staked;
    uint64 votedAt;
}

interface IDisputeManager {
    event DisputeCreated(
        bytes32 indexed disputeId,
        bytes32 indexed taskId,
        address indexed raisedBy,
        uint64 evidenceDeadline,
        uint64 votingDeadline
    );

    event EvidenceSubmitted(
        bytes32 indexed disputeId,
        address indexed submitter,
        bytes32 evidenceHash
    );

    event JurySelected(
        bytes32 indexed disputeId,
        address[] jurors
    );

    event VoteCast(
        bytes32 indexed disputeId,
        address indexed juror,
        DisputeResolution decision
    );

    event DisputeResolved(
        bytes32 indexed disputeId,
        DisputeResolution resolution,
        uint256 agentPayout,
        int256 scoreDelta
    );

    event RewardDistributed(
        bytes32 indexed disputeId,
        address indexed juror,
        uint256 reward
    );

    error DisputeNotFound(bytes32 disputeId);
    error InvalidStatus(DisputeStatus current, DisputeStatus expected);
    error AlreadyVoted(address juror);
    error EvidenceWindowClosed();
    error VotingWindowClosed();
    error InvalidJuror(address juror);
    error JuryNotRequired();

    function createDispute(
        bytes32 taskId,
        string calldata reason
    ) external returns (bytes32 disputeId);

    function submitEvidence(
        bytes32 disputeId,
        bytes32 evidenceHash,
        string calldata description
    ) external;

    function selectJury(bytes32 disputeId) external returns (address[] memory jurors);

    function castVote(
        bytes32 disputeId,
        DisputeResolution decision,
        string calldata reasoning
    ) external;

    function resolveDispute(bytes32 disputeId) external;

    function cancelDispute(bytes32 disputeId) external;

    function appealDispute(bytes32 disputeId, string calldata reason) external;

    function getDispute(bytes32 disputeId) external view returns (Dispute memory);

    function getDisputeStatus(bytes32 disputeId) external view returns (DisputeStatus);

    function getJury(bytes32 disputeId) external view returns (address[] memory);

    function getVote(bytes32 disputeId, address juror) external view returns (Vote memory);

    function getVoteCount(bytes32 disputeId) external view returns (uint256 forAgent, uint256 forPoster, uint256 split);

    function hasVoted(bytes32 disputeId, address juror) external view returns (bool);

    function getJurorStake(bytes32 disputeId, address juror) external view returns (JurorStake memory);
}
