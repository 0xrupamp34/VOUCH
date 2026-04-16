import {
  Agent,
  FleetInfo,
  AgentRegistered,
  TierUpgraded,
  AgentDeactivated,
  MetadataUpdated,
  FleetConfigured,
} from "../generated/AgentRegistry/AgentRegistry";
import {
  Agent as AgentSchema,
  FleetInfo as FleetInfoSchema,
} from "../generated/schema";

export function handleAgentRegistered(event: AgentRegistered): void {
  const agentId = event.params.tokenId.toString();
  
  let agent = AgentSchema.load(agentId);
  if (!agent) {
    agent = new AgentSchema(agentId);
    agent.tokenId = event.params.tokenId;
    agent.operator = event.params.operator;
    agent.agentWallet = event.params.agentWallet;
    agent.agentType = event.params.agentType;
    agent.registeredAt = event.params.registeredAt;
    agent.active = true;
    agent.rawScore = 0;
    agent.ewmaScore = 0;
    agent.tasksCompleted = 0;
    agent.tasksFailed = 0;
    agent.disputesRaised = 0;
    agent.disputesWon = 0;
    agent.totalUsdcProcessed = event.params.tokenId; // Placeholder
    agent.lastUpdated = event.block.timestamp;
    agent.isParent = false;
    agent.isSubAgent = false;
    agent.createdAt = event.block.timestamp;
    agent.updatedAt = event.block.timestamp;
  }
  
  agent.save();
}

export function handleTierUpgraded(event: TierUpgraded): void {
  const agentId = event.params.tokenId.toString();
  
  let agent = AgentSchema.load(agentId);
  if (agent) {
    agent.tier = event.params.newTier;
    agent.updatedAt = event.block.timestamp;
    agent.save();
  }
}

export function handleAgentDeactivated(event: AgentDeactivated): void {
  const agentId = event.params.tokenId.toString();
  
  let agent = AgentSchema.load(agentId);
  if (agent) {
    agent.active = false;
    agent.updatedAt = event.block.timestamp;
    agent.save();
  }
}

export function handleMetadataUpdated(event: MetadataUpdated): void {
  const agentId = event.params.tokenId.toString();
  
  let agent = AgentSchema.load(agentId);
  if (agent) {
    agent.metadataHash = event.params.newMetadataHash;
    agent.updatedAt = event.block.timestamp;
    agent.save();
  }
}

export function handleFleetConfigured(event: FleetConfigured): void {
  const agentId = event.params.tokenId.toString();
  
  let fleetInfo = FleetInfoSchema.load(agentId);
  if (!fleetInfo) {
    fleetInfo = new FleetInfoSchema(agentId);
    fleetInfo.agent = agentId;
  }
  
  const config = event.params.fleetInfo;
  fleetInfo.maxSubAgents = config.maxSubAgents;
  fleetInfo.currentSubAgentCount = config.currentSubAgentCount;
  fleetInfo.subTaskingEnabled = config.subTaskingEnabled;
  fleetInfo.delegationDepth = config.delegationDepth;
  fleetInfo.autoOptimization = config.autoOptimization;
  
  fleetInfo.save();
  
  let agent = AgentSchema.load(agentId);
  if (agent) {
    agent.fleetInfo = agentId;
    agent.isParent = config.maxSubAgents > 0;
    agent.save();
  }
}
