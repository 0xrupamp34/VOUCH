import {
  DisputeCreated,
  EvidenceSubmitted,
  VoteCast,
  DisputeResolved,
} from "../generated/DisputeManager/DisputeManager";
import {
  Dispute as DisputeSchema,
  Vote as VoteSchema,
} from "../generated/schema";

export function handleDisputeCreated(event: DisputeCreated): void {
  const disputeId = event.params.disputeId.toHexString();
  
  let dispute = DisputeSchema.load(disputeId);
  if (!dispute) {
    dispute = new DisputeSchema(disputeId);
    dispute.disputeId = event.params.disputeId;
    dispute.task = event.params.taskId.toHexString();
    dispute.raisedBy = event.params.raisedBy.toHexString();
    dispute.status = 0; // OPEN
    dispute.createdAt = event.params.createdAt;
    dispute.evidenceDeadline = event.params.evidenceDeadline;
    dispute.votingDeadline = event.params.votingDeadline;
    dispute.createdAt = event.block.timestamp;
  }
  
  dispute.save();
}

export function handleEvidenceSubmitted(event: EvidenceSubmitted): void {
  const disputeId = event.params.disputeId.toHexString();
  
  let dispute = DisputeSchema.load(disputeId);
  if (dispute) {
    dispute.status = 2; // EVIDENCE_SUBMISSION
    dispute.evidenceAgent = event.params.evidenceHash;
    dispute.save();
  }
}

export function handleVoteCast(event: VoteCast): void {
  const disputeId = event.params.disputeId.toHexString();
  const voteId = `${disputeId}-${event.params.juror.toHexString()}`;
  
  let vote = VoteSchema.load(voteId);
  if (!vote) {
    vote = new VoteSchema(voteId);
    vote.dispute = disputeId;
    vote.juror = event.params.juror;
    vote.decision = event.params.decision;
    vote.votedAt = event.block.timestamp;
    vote.createdAt = event.block.timestamp;
  }
  
  vote.save();
  
  let dispute = DisputeSchema.load(disputeId);
  if (dispute) {
    dispute.status = 3; // VOTING
    dispute.save();
  }
}

export function handleDisputeResolved(event: DisputeResolved): void {
  const disputeId = event.params.disputeId.toHexString();
  
  let dispute = DisputeSchema.load(disputeId);
  if (dispute) {
    dispute.status = 4; // RESOLVED
    dispute.resolution = event.params.resolution;
    dispute.agentPayout = event.params.agentPayout;
    dispute.scoreDelta = event.params.scoreDelta;
    dispute.resolvedAt = event.block.timestamp;
    dispute.save();
  }
}
