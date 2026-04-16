import {
  ScoreInitialized,
  ScoreUpdated,
  TierThresholdUpdated,
  AnomalyDetected,
  ScoreFrozen,
} from "../generated/ReputationEngine/ReputationEngine";
import {
  Agent as AgentSchema,
  ScoreEvent as ScoreEventSchema,
  AnomalyAlert as AnomalyAlertSchema,
  TierThreshold as TierThresholdSchema,
} from "../generated/schema";

export function handleScoreInitialized(event: ScoreInitialized): void {
  const agentId = event.params.agentId.toString();
  
  let agent = AgentSchema.load(agentId);
  if (agent) {
    agent.rawScore = 0;
    agent.ewmaScore = 0;
    agent.lastUpdated = event.block.timestamp;
    agent.save();
  }
}

export function handleScoreUpdated(event: ScoreUpdated): void {
  const agentId = event.params.agentId.toString();
  
  let agent = AgentSchema.load(agentId);
  if (!agent) return;
  
  agent.rawScore = event.params.newRawScore;
  agent.ewmaScore = event.params.newEwmaScore;
  agent.lastUpdated = event.block.timestamp;
  agent.save();
  
  const scoreEvent = new ScoreEventSchema(
    `${agentId}-${event.block.number.toString()}-${event.logIndex.toString()}`
  );
  scoreEvent.agent = agentId;
  scoreEvent.delta = event.params.delta;
  scoreEvent.newRawScore = event.params.newRawScore;
  scoreEvent.newEwmaScore = event.params.newEwmaScore;
  scoreEvent.reason = event.params.reason;
  scoreEvent.txHash = event.transaction.hash;
  scoreEvent.blockNumber = event.block.number;
  scoreEvent.timestamp = event.block.timestamp;
  scoreEvent.createdAt = event.block.timestamp;
  scoreEvent.save();
  
  // Update agent stats based on reason
  if (event.params.reason.includes("task_outcome")) {
    if (event.params.delta > 0) {
      agent.tasksCompleted += 1;
    } else {
      agent.tasksFailed += 1;
    }
    agent.save();
  }
}

export function handleTierThresholdUpdated(event: TierThresholdUpdated): void {
  const tierId = event.params.tier.toString();
  
  let threshold = TierThresholdSchema.load(tierId);
  if (!threshold) {
    threshold = new TierThresholdSchema(tierId);
    threshold.tier = event.params.tier;
  }
  
  threshold.minScore = event.params.minScore;
  threshold.updatedAt = event.block.timestamp;
  threshold.save();
}

export function handleAnomalyDetected(event: AnomalyDetected): void {
  const agentId = event.params.agentId.toString();
  
  let agent = AgentSchema.load(agentId);
  if (!agent) return;
  
  const alert = new AnomalyAlertSchema(
    `${agentId}-${event.block.number.toString()}-${event.logIndex.toString()}`
  );
  alert.agent = agentId;
  
  const flags = event.params.flags;
  if (flags.scoreVelocityHigh) {
    alert.anomalyType = 3; // SCORE_MANIPULATION
  } else if (flags.taskFrequencyHigh) {
    alert.anomalyType = 1; // RAPID_FARMING
  } else if (flags.qualityAnomaly) {
    alert.anomalyType = 4; // QUALITY_ANOMALY
  } else if (flags.behaviorAnomaly) {
    alert.anomalyType = 5; // BEHAVIOR_ANOMALY
  } else {
    alert.anomalyType = 0; // UNKNOWN
  }
  
  alert.severity = 2; // MEDIUM
  alert.confidence = event.params.confidence;
  alert.description = `Anomaly detected: scoreVelocity=${flags.scoreVelocityHigh}, taskFreq=${flags.taskFrequencyHigh}`;
  alert.detectedAt = event.block.timestamp;
  alert.acknowledged = false;
  alert.resolved = false;
  alert.createdAt = event.block.timestamp;
  alert.save();
}

export function handleScoreFrozen(event: ScoreFrozen): void {
  const agentId = event.params.agentId.toString();
  
  let agent = AgentSchema.load(agentId);
  if (agent) {
    agent.frozenUntil = event.params.frozenUntil;
    agent.save();
  }
}
