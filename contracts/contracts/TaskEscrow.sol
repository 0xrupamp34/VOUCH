// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ITaskEscrow, Task, SubTask, TaskStatus } from "../interfaces/ITaskEscrow.sol";
import { IAgentRegistry } from "../interfaces/IAgentRegistry.sol";
import { IReputationEngine } from "../interfaces/IReputationEngine.sol";

contract TaskEscrow is ITaskEscrow, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint64 public constant MIN_DEADLINE = 1 hours;
    uint256 public constant PROTOCOL_FEE = 150;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_TASK_VALUE = 10000e6;
    uint256 public constant MAX_SUBTASK_DEPTH = 3;

    IERC20 public usdc;
    IAgentRegistry public agentRegistry;
    IReputationEngine public reputationEngine;

    mapping(bytes32 => Task) public tasks;
    mapping(bytes32 => SubTask[]) public subTasksByParent;
    mapping(bytes32 => mapping(uint256 => SubTask)) public subTasks;
    mapping(address => bytes32[]) public tasksByPoster;
    mapping(uint256 => bytes32[]) public tasksByAgent;
    mapping(bytes32 => uint256) public taskIndex;
    mapping(bytes32 => bool) public taskExists;
    mapping(bytes32 => mapping(address => bool)) public disputeRaised;

    uint256 private _taskCount;
    bytes32 private _taskIdNonce;

    uint64 public disputeWindowDuration = 24 hours;

    address public treasury;
    address public verifier;
    address public governance;

    modifier onlyAgentOperator(bytes32 taskId) {
        Task storage task = tasks[taskId];
        require(agentRegistry.getAgent(task.agentId).operator == msg.sender, "Not agent operator");
        _;
    }

    modifier onlyTaskPoster(bytes32 taskId) {
        require(tasks[taskId].poster == msg.sender, "Not task poster");
        _;
    }

    modifier onlyVerifier() {
        require(msg.sender == verifier || msg.sender == governance, "Not verifier");
        _;
    }

    constructor(
        address _usdc,
        address _agentRegistry,
        address _reputationEngine
    ) {
        usdc = IERC20(_usdc);
        agentRegistry = IAgentRegistry(_agentRegistry);
        reputationEngine = IReputationEngine(_reputationEngine);
    }

    function createTask(
        uint256 agentId,
        uint256 usdcAmount,
        uint64 deadline,
        bytes32 requirementsHash,
        string calldata title,
        string calldata description
    ) external nonReentrant returns (bytes32 taskId) {
        if (usdcAmount < 1e6) revert InvalidAmount();
        if (usdcAmount > MAX_TASK_VALUE) revert InvalidAmount();
        if (deadline < uint64(block.timestamp) + MIN_DEADLINE) revert DeadlineTooSoon(MIN_DEADLINE);
        if (!agentRegistry.isAgentActive(agentId)) revert AgentNotActive(agentId);

        taskId = _generateTaskId(msg.sender);

        Task storage task = tasks[taskId];
        task.taskId = taskId;
        task.poster = msg.sender;
        task.agentId = agentId;
        task.amount = usdcAmount;
        task.status = TaskStatus.OPEN;
        task.createdAt = uint64(block.timestamp);
        task.deadline = deadline;
        task.requirementsHash = requirementsHash;
        task.title = title;

        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        tasksByPoster[msg.sender].push(taskId);
        tasksByAgent[agentId].push(taskId);
        taskExists[taskId] = true;
        taskIndex[taskId] = tasksByPoster[msg.sender].length - 1;
        _taskCount++;

        emit TaskCreated(taskId, msg.sender, agentId, usdcAmount, deadline, title);
    }

    function acceptTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (!taskExists[taskId]) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.OPEN) revert InvalidStatus(task.status, TaskStatus.OPEN);

        Agent memory agent = agentRegistry.getAgent(task.agentId);
        require(agent.operator == msg.sender || agent.agentWallet == msg.sender, "Not agent operator");

        task.status = TaskStatus.ACCEPTED;
        task.acceptedAt = uint64(block.timestamp);
        task.submissionDeadline = task.deadline;

        emit TaskAccepted(taskId, task.agentId);
    }

    function submitCompletion(bytes32 taskId, bytes32 completionHash) 
        external 
        nonReentrant 
        onlyAgentOperator(taskId) 
    {
        Task storage task = tasks[taskId];
        if (!taskExists[taskId]) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.ACCEPTED) {
            revert InvalidStatus(task.status, TaskStatus.ACCEPTED);
        }

        if (uint64(block.timestamp) > task.submissionDeadline) {
            revert TaskExpired(taskId);
        }

        task.status = TaskStatus.SUBMISSION_PENDING;
        task.completionHash = completionHash;

        emit CompletionSubmitted(taskId, completionHash);
    }

    function requestVerification(bytes32 taskId) 
        external 
        returns (bytes32 requestId) 
    {
        Task storage task = tasks[taskId];
        if (!taskExists[taskId]) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.SUBMISSION_PENDING) {
            revert InvalidStatus(task.status, TaskStatus.SUBMISSION_PENDING);
        }

        task.status = TaskStatus.VERIFICATION_IN_PROGRESS;

        requestId = keccak256(abi.encodePacked(taskId, _taskIdNonce++));
        task.oracleRequestId = requestId;

        emit VerificationRequested(taskId, requestId);
    }

    function fulfillVerification(
        bytes32 requestId,
        bytes calldata response
    ) external nonReentrant onlyVerifier {
        (bytes32 taskId, uint8 qualityScore, bool success, bool onTime) = _decodeResponse(response);

        Task storage task = tasks[taskId];
        if (task.oracleRequestId != requestId) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.VERIFICATION_IN_PROGRESS) {
            revert InvalidStatus(task.status, TaskStatus.VERIFICATION_IN_PROGRESS);
        }

        task.qualityScore = qualityScore;

        if (success) {
            _finalizeTaskSuccess(taskId, qualityScore, onTime);
        } else {
            _finalizeTaskFailure(taskId);
        }
    }

    function _finalizeTaskSuccess(bytes32 taskId, uint8 qualityScore, bool onTime) internal {
        Task storage task = tasks[taskId];

        _settleSubTasks(taskId);

        uint256 protocolFees = (task.amount * PROTOCOL_FEE) / FEE_DENOMINATOR;
        uint256 agentPayout = task.amount - protocolFees;

        usdc.safeTransfer(treasury != address(0) ? treasury : msg.sender, protocolFees);
        usdc.safeTransfer(agentRegistry.getAgent(task.agentId).agentWallet, agentPayout);

        int256 scoreDelta = reputationEngine.calculateDelta(
            true,
            qualityScore,
            agentRegistry.getAgent(task.agentId).tier,
            onTime,
            task.amount
        );

        reputationEngine.recordOutcome(
            task.agentId,
            taskId,
            qualityScore,
            true,
            onTime,
            task.amount
        );

        task.status = TaskStatus.VERIFIED;

        emit TaskFinalized(taskId, true, agentPayout, scoreDelta);
        emit PaymentReleased(taskId, agentRegistry.getAgent(task.agentId).agentWallet, agentPayout);
    }

    function _finalizeTaskFailure(bytes32 taskId) internal {
        Task storage task = tasks[taskId];

        int256 scoreDelta = reputationEngine.calculateDelta(
            false,
            0,
            agentRegistry.getAgent(task.agentId).tier,
            false,
            task.amount
        );

        reputationEngine.recordOutcome(
            task.agentId,
            taskId,
            0,
            false,
            false,
            task.amount
        );

        usdc.safeTransfer(task.poster, task.amount);

        task.status = TaskStatus.FAILED;

        emit TaskFinalized(taskId, false, 0, scoreDelta);
        emit RefundIssued(taskId, task.poster, task.amount);
    }

    function raiseDispute(bytes32 taskId, string calldata reason) 
        external 
        nonReentrant 
    {
        Task storage task = tasks[taskId];
        if (!taskExists[taskId]) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.VERIFIED && task.status != TaskStatus.FAILED) {
            revert InvalidStatus(task.status, TaskStatus.VERIFIED);
        }

        uint64 verificationTime = uint64(block.timestamp) - task.acceptedAt;
        if (verificationTime > disputeWindowDuration) revert DisputeWindowClosed();

        if (disputeRaised[taskId][msg.sender]) revert Unauthorized(msg.sender);

        disputeRaised[taskId][msg.sender] = true;
        task.status = TaskStatus.DISPUTED;

        emit DisputeRaised(taskId, msg.sender);
    }

    function cancelTask(bytes32 taskId) external nonReentrant onlyTaskPoster(taskId) {
        Task storage task = tasks[taskId];
        if (!taskExists[taskId]) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.OPEN) {
            revert InvalidStatus(task.status, TaskStatus.OPEN);
        }

        usdc.safeTransfer(task.poster, task.amount);
        task.status = TaskStatus.CANCELLED;

        emit TaskCancelled(taskId, msg.sender);
        emit RefundIssued(taskId, task.poster, task.amount);
    }

    function expireTask(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        if (!taskExists[taskId]) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.OPEN && task.status != TaskStatus.ACCEPTED) {
            revert InvalidStatus(task.status, TaskStatus.OPEN);
        }

        if (uint64(block.timestamp) < task.deadline) revert InvalidStatus(task.status, TaskStatus.OPEN);

        if (task.status == TaskStatus.OPEN) {
            usdc.safeTransfer(task.poster, task.amount);
            emit RefundIssued(taskId, task.poster, task.amount);
        }

        task.status = TaskStatus.EXPIRED;

        emit TaskExpired(taskId);
    }

    function resolveDispute(
        bytes32 taskId,
        uint8 resolution,
        uint256 agentPayout,
        int256 scoreDelta
    ) external nonReentrant {
        Task storage task = tasks[taskId];
        if (!taskExists[taskId]) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.DISPUTED) {
            revert InvalidStatus(task.status, TaskStatus.DISPUTED);
        }

        if (resolution == 0) {
            usdc.safeTransfer(task.poster, task.amount);
            emit RefundIssued(taskId, task.poster, task.amount);
        } else if (resolution == 1) {
            usdc.safeTransfer(agentRegistry.getAgent(task.agentId).agentWallet, task.amount);
            emit PaymentReleased(taskId, agentRegistry.getAgent(task.agentId).agentWallet, task.amount);
        } else {
            uint256 posterShare = (task.amount * 60) / 100;
            uint256 agentShare = task.amount - posterShare;
            usdc.safeTransfer(task.poster, posterShare);
            usdc.safeTransfer(agentRegistry.getAgent(task.agentId).agentWallet, agentShare);
            emit RefundIssued(taskId, task.poster, posterShare);
            emit PaymentReleased(taskId, agentRegistry.getAgent(task.agentId).agentWallet, agentShare);
        }

        task.status = TaskStatus.RESOLVED;

        emit TaskFinalized(taskId, resolution == 1, agentPayout, scoreDelta);
    }

    function createSubTask(
        bytes32 parentTaskId,
        uint256 subAgentId,
        uint256 budget,
        bytes32 requirementsHash,
        uint64 deadline
    ) external nonReentrant returns (bytes32 subTaskId) {
        Task storage parentTask = tasks[parentTaskId];
        if (!taskExists[parentTaskId]) revert TaskNotFound(parentTaskId);
        if (parentTask.status != TaskStatus.ACCEPTED && parentTask.status != TaskStatus.SUBMISSION_PENDING) {
            revert InvalidStatus(parentTask.status, TaskStatus.ACCEPTED);
        }

        Agent memory parentAgent = agentRegistry.getAgent(parentTask.agentId);
        require(parentAgent.operator == msg.sender, "Not parent agent operator");

        FleetInfo memory fleet = agentRegistry.getFleetInfo(parentTask.agentId);
        require(fleet.subTaskingEnabled, "Sub-tasking not enabled");
        require(subTasksByParent[parentTaskId].length < fleet.maxSubAgents, "Max sub-tasks reached");

        if (!_checkSubTaskDepth(parentTaskId, fleet.delegationDepth)) {
            revert SubTaskDepthExceeded();
        }

        subTaskId = keccak256(abi.encodePacked(parentTaskId, subAgentId, _taskIdNonce++));

        SubTask storage subTask = subTasks[parentTaskId][uint256(uint160(subAgentId))];
        subTask.id = subTaskId;
        subTask.parentTaskId = parentTaskId;
        subTask.parentAgentId = parentTask.agentId;
        subTask.subAgentId = subAgentId;
        subTask.requirementsHash = requirementsHash;
        subTask.budget = budget;
        subTask.deadline = deadline;
        subTask.status = 0;
        subTask.createdAt = uint64(block.timestamp);

        subTasksByParent[parentTaskId].push(subTask);

        emit SubTaskCreated(parentTaskId, subTaskId, subAgentId, budget);
    }

    function assignSubTask(bytes32 subTaskId, uint256 subAgentId) external {
        SubTask storage subTask = subTasks[msg.sender][subTaskId];
        if (subTask.id != subTaskId) revert SubTaskNotFound(subTaskId);
        require(subTask.subAgentId == subAgentId || subTask.subAgentId == 0, "Sub-agent mismatch");
        subTask.status = 1;
    }

    function submitSubTaskCompletion(bytes32 parentTaskId, bytes32 completionHash) external nonReentrant {
        SubTask storage subTask = subTasks[parentTaskId][uint256(uint160(msg.sender))];
        if (subTask.id == bytes32(0)) revert SubTaskNotFound(subTaskId);
        require(subTask.status == 1, "Sub-task not assigned");

        subTask.completionHash = completionHash;
        subTask.status = 2;

        emit SubTaskCompleted(subTask.id, completionHash);
    }

    function verifySubTask(bytes32 parentTaskId, uint8 qualityScore) external onlyVerifier {
        SubTask storage subTask = subTasks[parentTaskId][uint256(uint160(tx.origin))];
        if (subTask.id == bytes32(0)) revert SubTaskNotFound(parentTaskId);
        require(subTask.status == 2, "Sub-task not submitted");

        subTask.qualityScore = qualityScore;
        subTask.completedAt = uint64(block.timestamp);
        subTask.status = 3;

        int256 delta = reputationEngine.calculateDelta(
            true,
            qualityScore,
            agentRegistry.getAgent(subTask.subAgentId).tier,
            true,
            subTask.budget
        );

        reputationEngine.recordSubTaskReputation(
            subTask.parentTaskId,
            subTask.id,
            subTask.parentAgentId,
            subTask.subAgentId,
            delta,
            qualityScore,
            subTask.budget
        );

        emit SubTaskVerified(subTask.id, qualityScore);
    }

    function settleSubTasks(bytes32 parentTaskId) internal {
        SubTask[] storage parentSubTasks = subTasksByParent[parentTaskId];
        for (uint256 i = 0; i < parentSubTasks.length; i++) {
            SubTask storage subTask = subTasks[parentTaskId][uint256(uint160(parentSubTasks[i].subAgentId))];
            if (!subTask.settled && subTask.status == 3) {
                subTask.settled = true;
            }
        }
    }

    function _checkSubTaskDepth(bytes32 parentTaskId, uint256 maxDepth) internal view returns (bool) {
        uint256 depth = 0;
        bytes32 currentTaskId = parentTaskId;
        
        while (depth < maxDepth) {
            SubTask[] storage subTasksList = subTasksByParent[currentTaskId];
            if (subTasksList.length == 0) break;
            depth++;
        }
        
        return depth < maxDepth;
    }

    function _generateTaskId(address sender) internal returns (bytes32) {
        return keccak256(abi.encodePacked(
            sender,
            block.timestamp,
            _taskIdNonce++,
            block.prevrandao
        ));
    }

    function _decodeResponse(bytes calldata response) 
        internal 
        pure 
        returns (bytes32 taskId, uint8 qualityScore, bool success, bool onTime) 
    {
        if (response.length == 0) {
            return (bytes32(0), 0, false, false);
        }

        uint256 data = uint256(bytes32(response[:32]));
        taskId = bytes32(data >> 64);
        onTime = (data & (1 << 56)) != 0;
        qualityScore = uint8((data >> 48) & 0xFF);
        success = (data & (1 << 63)) != 0;
    }

    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    function getTaskStatus(bytes32 taskId) external view returns (TaskStatus) {
        return tasks[taskId].status;
    }

    function getSubTask(bytes32 subTaskId) external view returns (SubTask memory) {
        return subTasks[msg.sender][uint256(uint160(subTaskId))];
    }

    function getSubTasksByParent(bytes32 parentTaskId) external view returns (bytes32[] memory) {
        SubTask[] storage parentSubTasks = subTasksByParent[parentTaskId];
        bytes32[] memory ids = new bytes32[](parentSubTasks.length);
        for (uint256 i = 0; i < parentSubTasks.length; i++) {
            ids[i] = parentSubTasks[i].id;
        }
        return ids;
    }

    function getTasksByPoster(address poster) external view returns (bytes32[] memory) {
        return tasksByPoster[poster];
    }

    function getTasksByAgent(uint256 agentId) external view returns (bytes32[] memory) {
        return tasksByAgent[agentId];
    }

    function getTaskCount() external view returns (uint256) {
        return _taskCount;
    }

    function getMinimumDeadline() external pure returns (uint64) {
        return MIN_DEADLINE;
    }

    function getProtocolFee() external pure returns (uint256) {
        return PROTOCOL_FEE;
    }

    function getMaxTaskValue() external pure returns (uint256) {
        return MAX_TASK_VALUE;
    }

    function setTreasury(address _treasury) external {
        require(treasury == address(0), "Already set");
        treasury = _treasury;
    }

    function setVerifier(address _verifier) external {
        require(verifier == address(0), "Already set");
        verifier = _verifier;
    }

    function setGovernance(address _governance) external {
        require(governance == address(0), "Already set");
        governance = _governance;
    }
}
