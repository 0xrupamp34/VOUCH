// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IReputationEngine } from "../interfaces/IReputationEngine.sol";
import { IAgentRegistry } from "../interfaces/IAgentRegistry.sol";

contract ReputationEngine is IReputationEngine, ReentrancyGuard {

    int256 public constant MIN_SCORE = -10000;
    int256 public constant MAX_SCORE = 10000;
    int256 public constant EWMA_ALPHA = 0.1e18;
    int256 public constant PRECISION = 1e18;

    int256 public constant BASE_POINTS_SUCCESS = 50e18;
    int256 public constant BASE_POINTS_FAILURE = -100e18;
    int256 public constant MAX_DELTA = 500e18;
    int256 public constant MIN_DELTA = -300e18;

    mapping(uint256 => ReputationScore) private _scores;
    mapping(uint256 => AnomalyFlags) private _anomalyFlags;
    mapping(uint256 => mapping(uint256 => int256)) private _scoreHistory;
    mapping(uint256 => uint256) private _scoreHistoryLength;
    mapping(uint256 => uint64) private _frozenUntil;
    mapping(uint256 => mapping(bytes32 => SubTaskReputation)) private _subTaskReputations;
    mapping(bytes32 => bool) private _processedTasks;

    mapping(Tier => int256) public tierThresholds;
    mapping(uint256 => int256) private _scoreVelocityWindow;

    address public agentRegistry;
    address public taskEscrow;
    address public disputeManager;
    address public governance;

    uint256 public constant SCORE_VELOCITY_WINDOW = 1 hours;
    uint256 public constant ANOMALY_THRESHOLD_VELOCITY = 500e18;
    uint256 public constant ANOMALY_THRESHOLD_FREQUENCY = 20;

    modifier onlyEscrow() {
        if (msg.sender != taskEscrow) revert OnlyEscrow(msg.sender);
        _;
    }

    modifier onlyDisputeManager() {
        if (msg.sender != disputeManager) revert OnlyDisputeManager(msg.sender);
        _;
    }

    modifier onlyAuthorized() {
        if (msg.sender != governance && msg.sender != disputeManager) revert OnlyAuthorized(msg.sender);
        _;
    }

    modifier whenNotFrozen(uint256 agentId) {
        if (_frozenUntil[agentId] > block.timestamp) {
            revert ScoreFrozen(agentId, _frozenUntil[agentId]);
        }
        _;
    }

    constructor(address _agentRegistry) {
        agentRegistry = _agentRegistry;
        _initializeTierThresholds();
    }

    function _initializeTierThresholds() internal {
        tierThresholds[Tier.UNRANKED] = MIN_SCORE;
        tierThresholds[Tier.BRONZE] = 500e18;
        tierThresholds[Tier.SILVER] = 2000e18;
        tierThresholds[Tier.GOLD] = 5000e18;
        tierThresholds[Tier.PLATINUM] = 8000e18;
    }

    function initializeScore(uint256 agentId) external {
        ReputationScore storage score = _scores[agentId];
        score.agentId = agentId;
        score.rawScore = 0;
        score.ewmaScore = 0;
        score.tasksCompleted = 0;
        score.tasksFailed = 0;
        score.disputesRaised = 0;
        score.disputesWon = 0;
        score.totalUsdcProcessed = 0;
        score.lastUpdated = uint64(block.timestamp);

        emit ScoreInitialized(agentId, 0);
    }

    function recordOutcome(
        uint256 agentId,
        bytes32 taskId,
        uint8 qualityScore,
        bool success,
        bool onTime,
        uint256 usdcAmount
    ) external nonReentrant onlyEscrow whenNotFrozen(agentId) {
        if (_processedTasks[taskId]) revert InvalidAgent(agentId);
        _processedTasks[taskId] = true;

        Agent memory agent = IAgentRegistry(agentRegistry).getAgent(agentId);
        int256 delta = calculateDelta(success, qualityScore, agent.tier, onTime, usdcAmount);

        _updateScore(agentId, delta, "task_outcome");

        ReputationScore storage score = _scores[agentId];
        if (success) {
            score.tasksCompleted++;
        } else {
            score.tasksFailed++;
        }
        score.totalUsdcProcessed += usdcAmount;
        score.lastTaskCompletedAt = uint64(block.timestamp);

        _checkAndFlagAnomalies(agentId, delta);
    }

    function applyDisputeOutcome(
        uint256 agentId,
        int256 delta,
        string calldata reason
    ) external nonReentrant onlyDisputeManager whenNotFrozen(agentId) {
        _updateScore(agentId, delta, reason);

        ReputationScore storage score = _scores[agentId];
        score.disputesRaised++;
        if (delta > 0) {
            score.disputesWon++;
        }
    }

    function recordSubTaskReputation(
        bytes32 parentTaskId,
        bytes32 subTaskId,
        uint256 parentAgentId,
        uint256 subAgentId,
        int256 delta,
        uint8 qualityScore,
        uint256 usdcAmount
    ) external onlyEscrow {
        Agent memory parentAgent = IAgentRegistry(agentRegistry).getAgent(parentAgentId);
        
        int256 subAgentDelta = delta * 70 / 100;
        int256 parentBonus = delta * 15 / 100;

        _updateScore(subAgentId, subAgentDelta, "subtask_completion");

        SubTaskReputation storage record = _subTaskReputations[parentAgentId][subTaskId];
        record.parentTaskId = parentTaskId;
        record.subTaskId = subTaskId;
        record.subAgentId = subAgentId;
        record.scoreContribution = subAgentDelta;
        record.parentBonus = parentBonus;
        record.settled = false;

        emit SubTaskReputationRecorded(parentTaskId, subTaskId, subAgentId, subAgentDelta);
    }

    function slashScore(
        uint256 agentId,
        int256 penalty,
        string calldata reason
    ) external nonReentrant onlyAuthorized {
        int256 adjustedPenalty = _clampScore(penalty);
        _updateScore(agentId, adjustedPenalty, reason);

        ReputationScore storage score = _scores[agentId];
        score.tasksFailed++;
    }

    function adjustScore(
        uint256 agentId,
        int256 adjustment,
        string calldata reason,
        address authorizedBy
    ) external nonReentrant onlyAuthorized {
        _updateScore(agentId, adjustment, reason);
        emit ScoreAdjustment(agentId, adjustment, reason, authorizedBy);
    }

    function freezeScore(uint256 agentId, uint64 duration) external onlyAuthorized {
        uint64 frozenUntil = uint64(block.timestamp) + duration;
        _frozenUntil[agentId] = frozenUntil;
        emit ScoreFrozen(agentId, frozenUntil);
    }

    function unfreezeScore(uint256 agentId) external onlyAuthorized {
        _frozenUntil[agentId] = 0;
    }

    function _updateScore(uint256 agentId, int256 delta, string memory reason) internal {
        ReputationScore storage score = _scores[agentId];

        int256 newRawScore = _clampScore(score.rawScore + delta);

        int256 deltaScaled = delta * PRECISION;
        int256 alphaTimesDelta = (EWMA_ALPHA * deltaScaled) / PRECISION;
        int256 oneMinusAlpha = PRECISION - EWMA_ALPHA;
        int256 oneMinusAlphaTimesEwma = (oneMinusAlpha * score.ewmaScore) / PRECISION;
        int256 newEwmaScaled = alphaTimesDelta + oneMinusAlphaTimesEwma;
        int256 newEwma = newEwmaScaled / PRECISION;

        newEwma = _clampScore(newEwma);

        uint256 historyLength = _scoreHistoryLength[agentId];
        _scoreHistory[agentId][historyLength] = newEwma;
        _scoreHistoryLength[agentId] = historyLength + 1;

        score.rawScore = newRawScore;
        score.ewmaScore = newEwma;
        score.lastUpdated = uint64(block.timestamp);

        _scoreVelocityWindow[agentId] = (uint256(uint256(score.ewmaScore)) << 128) | uint64(block.timestamp);

        emit ScoreUpdated(agentId, delta, newRawScore, newEwma, reason);
    }

    function _clampScore(int256 score) internal pure returns (int256) {
        if (score < MIN_SCORE) return MIN_SCORE;
        if (score > MAX_SCORE) return MAX_SCORE;
        return score;
    }

    function _checkAndFlagAnomalies(uint256 agentId, int256 delta) internal {
        AnomalyFlags memory flags;

        (int256 velocity, ) = _getScoreVelocityData(agentId);
        if (velocity > int256(ANOMALY_THRESHOLD_VELOCITY)) {
            flags.scoreVelocityHigh = true;
        }

        ReputationScore storage score = _scores[agentId];
        uint256 recentTasks = score.tasksCompleted + score.tasksFailed;
        if (recentTasks > 0 && recentTasks % 10 == 0) {
            int256 recentVelocity = _calculateRecentVelocity(agentId);
            if (recentVelocity > int256(ANOMALY_THRESHOLD_VELOCITY)) {
                flags.taskFrequencyHigh = true;
            }
        }

        if (flags.scoreVelocityHigh || flags.taskFrequencyHigh) {
            _anomalyFlags[agentId] = flags;
            emit AnomalyDetected(agentId, flags, 7500);
        }
    }

    function _getScoreVelocityData(uint256 agentId) internal view returns (int256 velocity, uint64 timestamp) {
        uint256 data = _scoreVelocityWindow[agentId];
        velocity = int256(uint256(uint128(data >> 128)));
        timestamp = uint64(data & type(uint128).max);
    }

    function _calculateRecentVelocity(uint256 agentId) internal view returns (int256) {
        ReputationScore storage score = _scores[agentId];
        uint256 historyLength = _scoreHistoryLength[agentId];
        
        if (historyLength < 2) return 0;

        uint256 windowSize = 10;
        if (historyLength < windowSize) windowSize = historyLength;

        int256 sum = 0;
        for (uint256 i = historyLength - windowSize; i < historyLength; i++) {
            sum += _scoreHistory[agentId][i];
        }

        int256 avgVelocity = sum / int256(windowSize);
        return avgVelocity * int256(windowSize);
    }

    function getScore(uint256 agentId) external view returns (int256 ewmaScore) {
        return _scores[agentId].ewmaScore;
    }

    function getFullScore(uint256 agentId) external view returns (ReputationScore memory) {
        return _scores[agentId];
    }

    function tierForScore(int256 score) external view returns (Tier tier) {
        if (score >= tierThresholds[Tier.PLATINUM]) return Tier.PLATINUM;
        if (score >= tierThresholds[Tier.GOLD]) return Tier.GOLD;
        if (score >= tierThresholds[Tier.SILVER]) return Tier.SILVER;
        if (score >= tierThresholds[Tier.BRONZE]) return Tier.BRONZE;
        return Tier.UNRANKED;
    }

    function getTierThreshold(Tier tier) external view returns (int256 minScore) {
        return tierThresholds[tier];
    }

    function setTierThreshold(Tier tier, int256 minScore) external onlyAuthorized {
        require(minScore >= MIN_SCORE && minScore <= MAX_SCORE, "Invalid threshold");
        tierThresholds[tier] = minScore;
        emit TierThresholdUpdated(tier, minScore);
    }

    function getSubTaskReputation(bytes32 subTaskId) external view returns (SubTaskReputation memory) {
        return _subTaskReputations[msg.sender][subTaskId];
    }

    function isScoreFrozen(uint256 agentId) external view returns (bool frozen, uint64 frozenUntil) {
        frozen = _frozenUntil[agentId] > block.timestamp;
        frozenUntil = _frozenUntil[agentId];
    }

    function getScoreVelocity(uint256 agentId, uint256 windowHours) 
        external view returns (int256) 
    {
        (int256 currentVelocity, ) = _getScoreVelocityData(agentId);
        return currentVelocity;
    }

    function getAnomalyFlags(uint256 agentId) external view returns (AnomalyFlags memory) {
        return _anomalyFlags[agentId];
    }

    function checkForAnomalies(uint256 agentId) external returns (AnomalyFlags memory) {
        AnomalyFlags memory flags;
        
        (int256 velocity, ) = _getScoreVelocityData(agentId);
        if (velocity > int256(ANOMALY_THRESHOLD_VELOCITY)) {
            flags.scoreVelocityHigh = true;
        }

        flags.taskFrequencyHigh = _checkTaskFrequency(agentId);

        _anomalyFlags[agentId] = flags;

        if (flags.scoreVelocityHigh || flags.taskFrequencyHigh) {
            emit AnomalyDetected(agentId, flags, 7500);
        }

        return flags;
    }

    function _checkTaskFrequency(uint256 agentId) internal view returns (bool) {
        ReputationScore storage score = _scores[agentId];
        uint256 recentWindow = 1 hours;
        uint256 recentTasks = 0;

        uint256 historyLength = _scoreHistoryLength[agentId];
        for (uint256 i = 0; i < historyLength && i < 100; i++) {
            recentTasks++;
        }

        return recentTasks > ANOMALY_THRESHOLD_FREQUENCY;
    }

    function calculateDelta(
        bool success,
        uint8 qualityScore,
        Tier tier,
        bool onTime,
        uint256 usdcAmount
    ) public pure returns (int256 delta) {
        int256 basePoints = success ? BASE_POINTS_SUCCESS : BASE_POINTS_FAILURE;

        int256 qualityMultiplier = int256(uint256(qualityScore)) * 2e18 / 100;

        int256 timelinessFactor;
        if (onTime) {
            timelinessFactor = 120e16;
        } else {
            timelinessFactor = 80e16;
        }

        int256 volumeBonus = int256((_log10(usdcAmount + 1) * 10e18) / 1e18);

        int256 tierMultiplier;
        if (tier == Tier.UNRANKED) tierMultiplier = 120e16;
        else if (tier == Tier.BRONZE) tierMultiplier = 110e16;
        else if (tier == Tier.SILVER) tierMultiplier = 100e16;
        else if (tier == Tier.GOLD) tierMultiplier = 90e16;
        else tierMultiplier = 80e16;

        if (success) {
            delta = (basePoints * qualityMultiplier * timelinessFactor * tierMultiplier) / (100e18 * 100e16 * 100e16);
            delta += volumeBonus;
        } else {
            delta = basePoints;
            if (!onTime) {
                delta = (delta * 150) / 100;
            }
        }

        if (delta > MAX_DELTA) delta = MAX_DELTA;
        if (delta < MIN_DELTA) delta = MIN_DELTA;

        return delta / int256(PRECISION);
    }

    function _log10(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 result = 0;
        while (x >= 10) {
            x /= 10;
            result++;
        }
        return result;
    }

    function getEWMAAlpha() external pure returns (int256) {
        return EWMA_ALPHA;
    }

    function getScoreBounds() external view returns (int256 minScore, int256 maxScore) {
        return (MIN_SCORE, MAX_SCORE);
    }

    function setTaskEscrow(address _taskEscrow) external {
        require(taskEscrow == address(0), "Already set");
        taskEscrow = _taskEscrow;
    }

    function setDisputeManager(address _disputeManager) external {
        require(disputeManager == address(0), "Already set");
        disputeManager = _disputeManager;
    }

    function setGovernance(address _governance) external {
        require(governance == address(0), "Already set");
        governance = _governance;
    }
}
