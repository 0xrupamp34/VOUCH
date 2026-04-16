import {
  TaskCreated,
  TaskAccepted,
  CompletionSubmitted,
  VerificationRequested,
  TaskFinalized,
  DisputeRaised,
  SubTaskCreated,
} from "../generated/TaskEscrow/TaskEscrow";
import {
  Task as TaskSchema,
  SubTask as SubTaskSchema,
  Dispute as DisputeSchema,
} from "../generated/schema";
import { Address } from "@graphprotocol/graph-ts";

export function handleTaskCreated(event: TaskCreated): void {
  const taskIdBytes = event.params.taskId;
  
  let task = TaskSchema.load(taskIdBytes.toHexString());
  if (!task) {
    task = new TaskSchema(taskIdBytes.toHexString());
    task.taskId = taskIdBytes;
    task.poster = event.params.poster;
    task.amountUsdc = event.params.amount;
    task.title = event.params.title;
    task.createdAt = event.params.createdAt;
    task.deadline = event.params.deadline;
    task.status = 0; // OPEN
    task.createdAt = event.block.timestamp;
    task.updatedAt = event.block.timestamp;
  }
  
  task.agent = event.params.agentId.toString();
  task.save();
}

export function handleTaskAccepted(event: TaskAccepted): void {
  const taskId = event.params.taskId.toHexString();
  
  let task = TaskSchema.load(taskId);
  if (task) {
    task.status = 1; // ACCEPTED
    task.acceptedAt = event.block.timestamp;
    task.updatedAt = event.block.timestamp;
    task.save();
  }
}

export function handleCompletionSubmitted(event: CompletionSubmitted): void {
  const taskId = event.params.taskId.toHexString();
  
  let task = TaskSchema.load(taskId);
  if (task) {
    task.status = 2; // SUBMISSION_PENDING
    task.completionHash = event.params.completionHash;
    task.updatedAt = event.block.timestamp;
    task.save();
  }
}

export function handleVerificationRequested(event: VerificationRequested): void {
  const taskId = event.params.taskId.toHexString();
  
  let task = TaskSchema.load(taskId);
  if (task) {
    task.status = 3; // VERIFICATION_IN_PROGRESS
    task.oracleRequestId = event.params.chainlinkRequestId;
    task.updatedAt = event.block.timestamp;
    task.save();
  }
}

export function handleTaskFinalized(event: TaskFinalized): void {
  const taskId = event.params.taskId.toHexString();
  
  let task = TaskSchema.load(taskId);
  if (task) {
    if (event.params.success) {
      task.status = 4; // VERIFIED
    } else {
      task.status = 5; // FAILED
    }
    task.completedAt = event.block.timestamp;
    task.updatedAt = event.block.timestamp;
    task.save();
  }
}

export function handleDisputeRaised(event: DisputeRaised): void {
  const taskId = event.params.taskId.toHexString();
  
  let task = TaskSchema.load(taskId);
  if (task) {
    task.status = 6; // DISPUTED
    task.updatedAt = event.block.timestamp;
    task.save();
  }
}

export function handleSubTaskCreated(event: SubTaskCreated): void {
  const subTaskId = event.params.subTaskId.toHexString();
  
  let subTask = SubTaskSchema.load(subTaskId);
  if (!subTask) {
    subTask = new SubTaskSchema(subTaskId);
    subTask.taskId = event.params.parentTaskId;
    subTask.parentAgent = event.params.parentAgentId.toString();
    subTask.budgetUsdc = event.params.budget;
    subTask.status = 0; // PENDING
    subTask.createdAt = event.block.timestamp;
    subTask.createdAt = event.block.timestamp;
  }
  
  subTask.save();
}
