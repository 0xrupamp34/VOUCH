// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct ReputationScore {
    uint256 agentId;
    int256 rawScore;
    int256 ewmaScore;
    uint256 tasksCompleted;
    uint256 tasksFailed;
    uint256 disputesRaised;
    uint256 disputesWon;
    uint256 totalUsdcProcessed;
    uint64 lastUpdated;
    uint64 lastTaskCompletedAt;
}

struct SubTaskReputation {
    bytes32 parentTaskId;
    bytes32 subTaskId;
    uint256 subAgentId;
    int256 scoreContribution;
    int256 parentBonus;
    bool settled;
}

struct AnomalyFlags {
    bool scoreVelocityHigh;
    bool taskFrequencyHigh;
    bool qualityAnomaly;
    bool behaviorAnomaly;
}

interface IReputationEngine {
    event ScoreInitialized(
        uint256 indexed agentId,
        int256 initialScore
    );

    event ScoreUpdated(
        uint256 indexed agentId,
        int256 delta,
        int256 newRawScore,
        int256 newEwmaScore,
        string reason
    );

    event TierThresholdUpdated(
        Tier indexed tier,
        int256 minScore
    );

    event ScoreBoundsUpdated(
        int256 minScore,
        int256 maxScore
    );

    event AnomalyDetected(
        uint256 indexed agentId,
        AnomalyFlags flags,
        uint256 confidence
    );

    event SubTaskReputationRecorded(
        bytes32 indexed parentTaskId,
        bytes32 indexed subTaskId,
        uint256 subAgentId,
        int256 scoreContribution
    );

    event ScoreFrozen(
        uint256 indexed agentId,
        uint64 frozenUntil
    );

    event ScoreAdjustment(
        uint256 indexed agentId,
        int256 adjustment,
        string reason,
        address authorizedBy
    );

    error InvalidAgent(uint256 tokenId);
    error ScoreFrozen(uint256 tokenId, uint64 frozenUntil);
    error InvalidScoreBounds(int256 min, int256 max);
    error OnlyEscrow(address caller);
    error OnlyDisputeManager(address caller);
    error OnlyAuthorized(address caller);

    function initializeScore(uint256 agentId) external;

    function recordOutcome(
        uint256 agentId,
        bytes32 taskId,
        uint8 qualityScore,
        bool success,
        bool onTime,
        uint256 usdcAmount
    ) external;

    function applyDisputeOutcome(
        uint256 agentId,
        int256 delta,
        string calldata reason
    ) external;

    function recordSubTaskReputation(
        bytes32 parentTaskId,
        bytes32 subTaskId,
        uint256 parentAgentId,
        uint256 subAgentId,
        int256 delta,
        uint8 qualityScore,
        uint256 usdcAmount
    ) external;

    function slashScore(
        uint256 agentId,
        int256 penalty,
        string calldata reason
    ) external;

    function adjustScore(
        uint256 agentId,
        int256 adjustment,
        string calldata reason,
        address authorizedBy
    ) external;

    function freezeScore(
        uint256 agentId,
        uint64 duration
    ) external;

    function unfreezeScore(uint256 agentId) external;

    function getScore(uint256 agentId) external view returns (int256 ewmaScore);

    function getFullScore(uint256 agentId) external view returns (ReputationScore memory);

    function tierForScore(int256 score) external view returns (Tier tier);

    function getTierThreshold(Tier tier) external view returns (int256 minScore);

    function setTierThreshold(Tier tier, int256 minScore) external;

    function getSubTaskReputation(bytes32 subTaskId) external view returns (SubTaskReputation memory);

    function isScoreFrozen(uint256 agentId) external view returns (bool, uint64);

    function getScoreVelocity(uint256 agentId, uint256 windowHours) external view returns (int256);

    function getAnomalyFlags(uint256 agentId) external view returns (AnomalyFlags memory);

    function checkForAnomalies(uint256 agentId) external returns (AnomalyFlags memory);

    function calculateDelta(
        bool success,
        uint8 qualityScore,
        Tier tier,
        bool onTime,
        uint256 usdcAmount
    ) external pure returns (int256 delta);

    function getEWMAAlpha() external pure returns (int256);

    function getScoreBounds() external view returns (int256 minScore, int256 maxScore);
}
