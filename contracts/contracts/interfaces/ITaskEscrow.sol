// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum TaskStatus {
    OPEN,
    ACCEPTED,
    SUBMISSION_PENDING,
    VERIFICATION_IN_PROGRESS,
    VERIFIED,
    FAILED,
    DISPUTED,
    RESOLVED,
    EXPIRED,
    CANCELLED
}

struct Task {
    bytes32 taskId;
    address poster;
    uint256 agentId;
    uint256 amount;
    TaskStatus status;
    uint64 createdAt;
    uint64 deadline;
    uint64 acceptedAt;
    uint64 submissionDeadline;
    bytes32 requirementsHash;
    bytes32 completionHash;
    bytes32 oracleRequestId;
    uint8 qualityScore;
    string title;
}

struct SubTask {
    bytes32 id;
    bytes32 parentTaskId;
    uint256 parentAgentId;
    uint256 subAgentId;
    bytes32 requirementsHash;
    uint256 budget;
    uint64 deadline;
    uint8 status;
    bytes32 completionHash;
    uint8 qualityScore;
    uint64 createdAt;
    uint64 completedAt;
    bool settled;
}

interface ITaskEscrow {
    event TaskCreated(
        bytes32 indexed taskId,
        address indexed poster,
        uint256 indexed agentId,
        uint256 amount,
        uint64 deadline,
        string title
    );

    event TaskAccepted(
        bytes32 indexed taskId,
        uint256 indexed agentId
    );

    event CompletionSubmitted(
        bytes32 indexed taskId,
        bytes32 completionHash
    );

    event VerificationRequested(
        bytes32 indexed taskId,
        bytes32 indexed chainlinkRequestId
    );

    event TaskFinalized(
        bytes32 indexed taskId,
        bool success,
        uint256 agentPayout,
        int256 scoreDelta
    );

    event DisputeRaised(
        bytes32 indexed taskId,
        address indexed by
    );

    event TaskExpired(
        bytes32 indexed taskId
    );

    event TaskCancelled(
        bytes32 indexed taskId,
        address indexed by
    );

    event SubTaskCreated(
        bytes32 indexed parentTaskId,
        bytes32 indexed subTaskId,
        uint256 subAgentId,
        uint256 budget
    );

    event SubTaskCompleted(
        bytes32 indexed subTaskId,
        bytes32 completionHash
    );

    event SubTaskVerified(
        bytes32 indexed subTaskId,
        uint8 qualityScore
    );

    event PaymentReleased(
        bytes32 indexed taskId,
        address indexed recipient,
        uint256 amount
    );

    event RefundIssued(
        bytes32 indexed taskId,
        address indexed recipient,
        uint256 amount
    );

    error TaskNotFound(bytes32 taskId);
    error InvalidStatus(TaskStatus current, TaskStatus expected);
    error InsufficientPayment();
    error DeadlineTooSoon(uint64 minDeadline);
    error Unauthorized(address caller);
    error AlreadyAssigned(bytes32 taskId);
    error VerificationInProgress(bytes32 taskId);
    error DisputeWindowClosed();
    error ZeroAddress();
    error InvalidAmount();
    error TaskExpired(bytes32 taskId);
    error SubTaskNotFound(bytes32 subTaskId);
    error SubTaskDepthExceeded();
    error OnlyOracle(address caller);
    error OnlyAgentOperator(address caller);

    function createTask(
        uint256 agentId,
        uint256 usdcAmount,
        uint64 deadline,
        bytes32 requirementsHash,
        string calldata title,
        string calldata description
    ) external returns (bytes32 taskId);

    function acceptTask(bytes32 taskId) external;

    function submitCompletion(bytes32 taskId, bytes32 completionHash) external;

    function requestVerification(bytes32 taskId) external returns (bytes32 requestId);

    function fulfillVerification(
        bytes32 requestId,
        bytes calldata response
    ) external;

    function raiseDispute(bytes32 taskId, string calldata reason) external;

    function cancelTask(bytes32 taskId) external;

    function expireTask(bytes32 taskId) external;

    function resolveDispute(
        bytes32 taskId,
        uint8 resolution,
        uint256 agentPayout,
        int256 scoreDelta
    ) external;

    function createSubTask(
        bytes32 parentTaskId,
        uint256 subAgentId,
        uint256 budget,
        bytes32 requirementsHash,
        uint64 deadline
    ) external returns (bytes32 subTaskId);

    function assignSubTask(bytes32 subTaskId, uint256 subAgentId) external;

    function submitSubTaskCompletion(bytes32 subTaskId, bytes32 completionHash) external;

    function verifySubTask(bytes32 subTaskId, uint8 qualityScore) external;

    function settleSubTasks(bytes32 parentTaskId) external;

    function getTask(bytes32 taskId) external view returns (Task memory);

    function getTaskStatus(bytes32 taskId) external view returns (TaskStatus);

    function getSubTask(bytes32 subTaskId) external view returns (SubTask memory);

    function getSubTasksByParent(bytes32 parentTaskId) external view returns (bytes32[] memory);

    function getTasksByPoster(address poster) external view returns (bytes32[] memory);

    function getTasksByAgent(uint256 agentId) external view returns (bytes32[] memory);

    function getTaskCount() external view returns (uint256);

    function getMinimumDeadline() external pure returns (uint64);

    function getProtocolFee() external pure returns (uint256);

    function getMaxTaskValue() external pure returns (uint256);
}
