export const typeDefs = `#graphql
  enum AgentType {
    LLM_BASED
    RULE_BASED
    HYBRID
  }

  enum Tier {
    UNRANKED
    BRONZE
    SILVER
    GOLD
    PLATINUM
  }

  enum TaskStatus {
    OPEN
    ACCEPTED
    SUBMISSION_PENDING
    VERIFICATION_IN_PROGRESS
    VERIFIED
    FAILED
    DISPUTED
    RESOLVED
    EXPIRED
    CANCELLED
  }

  enum DisputeStatus {
    OPEN
    UNDER_REVIEW
    EVIDENCE_SUBMISSION
    VOTING
    RESOLVED
    APPEALED
    CANCELLED
  }

  enum DisputeResolution {
    AGENT_WINS
    POSTER_WINS
    SPLIT
    NEGOTIATED
  }

  enum AnomalyType {
    SYBIL_ATTACK
    RAPID_FARMING
    COLLUSION
    SCORE_MANIPULATION
    QUALITY_ANOMALY
    BEHAVIOR_ANOMALY
    WALLET_ANOMALY
  }

  enum AnomalySeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type Agent {
    id: ID!
    tokenId: String!
    wallet: String!
    operator: String!
    displayName: String!
    description: String
    avatarUrl: String
    agentType: AgentType!
    subType: Int!
    specializations: [String!]!
    tier: Tier!
    tierLabel: String!
    rawScore: Int!
    ewmaScore: Int!
    tasksCompleted: Int!
    tasksFailed: Int!
    winRate: Float!
    disputesRaised: Int!
    disputesWon: Int!
    disputeWinRate: Float!
    totalUsdcProcessed: String!
    isActive: Boolean!
    registeredAt: String!
    lastActiveAt: String
    capabilities: [Capability!]!
    tierProgress: TierProgress
    fleet: FleetInfo
    scoreHistory(limit: Int): [ScoreEvent!]!
    tasks(status: TaskStatus, limit: Int, offset: Int): [Task!]!
    anomalies(limit: Int): [AnomalyAlert!]!
    fingerprint: AgentFingerprint
  }

  type Capability {
    id: String!
    name: String!
    category: String!
    verified: Boolean!
    avgQualityScore: Float
    maxTaskValue: String
  }

  type TierProgress {
    current: Int!
    required: Int!
    percentage: Float!
    remaining: Int!
  }

  type FleetInfo {
    parentAgentId: String
    maxSubAgents: Int!
    currentSubAgentCount: Int!
    subTaskingEnabled: Boolean!
    delegationDepth: Int!
    isParent: Boolean!
    isSubAgent: Boolean!
    subAgents: [Agent!]
  }

  type ScoreEvent {
    id: ID!
    delta: Int!
    newScore: Int!
    reason: String!
    reasonLabel: String!
    taskId: String
    qualityScore: Int
    onTime: Boolean
    usdcAmount: String
    timestamp: String!
    txHash: String!
  }

  type Task {
    id: ID!
    taskId: String!
    poster: String!
    agent: Agent!
    amountUsdc: String!
    status: TaskStatus!
    title: String!
    description: String
    requirementsUrl: String
    completionUrl: String
    qualityScore: Int
    deadline: String!
    createdAt: String!
    acceptedAt: String
    completedAt: String
    subTasks: [SubTask!]!
    dispute: Dispute
  }

  type SubTask {
    id: ID!
    taskId: String!
    parentAgent: Agent!
    subAgent: Agent
    description: String!
    requirementsUrl: String
    budgetUsdc: String!
    deadline: String!
    status: Int!
    qualityScore: Int
    createdAt: String!
    submittedAt: String
    completedAt: String
  }

  type Dispute {
    id: ID!
    disputeId: String!
    task: Task!
    raisedBy: Agent!
    status: DisputeStatus!
    resolution: DisputeResolution
    reason: String!
    evidencePoster: String
    evidenceAgent: String
    resolutionNotes: String
    agentPayout: String
    scoreDelta: Int
    createdAt: String!
    evidenceDeadline: String
    votingDeadline: String
    resolvedAt: String
    votes: [JurorVote!]
  }

  type JurorVote {
    juror: Agent!
    decision: DisputeResolution!
    reasoning: String
    votedAt: String!
  }

  type AnomalyAlert {
    id: ID!
    agent: Agent!
    anomalyType: AnomalyType!
    severity: AnomalySeverity!
    confidence: Int!
    description: String!
    evidence: String
    detectedAt: String!
    acknowledged: Boolean!
    acknowledgedAt: String
    resolved: Boolean!
    resolvedAt: String
  }

  type AgentFingerprint {
    id: ID!
    featuresHash: String!
    sampleSize: Int!
    lastUpdated: String!
    behavioralEmbedding: [Float!]
  }

  type Fleet {
    operator: String!
    agents: [Agent!]!
    config: FleetConfig!
    stats: FleetStats!
    createdAt: String!
  }

  type FleetConfig {
    maxAgents: Int!
    minTierForDelegation: Int!
    maxDelegationDepth: Int!
    autoOptimization: Boolean!
  }

  type FleetStats {
    totalAgents: Int!
    activeAgents: Int!
    aggregateScore: Int!
    averageAgentScore: Int!
    totalTasksCompleted: Int!
    totalTasksFailed: Int!
    overallWinRate: Float!
    totalRevenue: String!
    avgQualityScore: Float!
  }

  type Proposal {
    id: ID!
    proposalId: String!
    proposerAddr: String!
    title: String!
    description: String!
    proposalType: String!
    status: String!
    votesFor: String!
    votesAgainst: String!
    quorumMet: Boolean!
    proposedAt: String!
    voteEnd: String!
    executedAt: String
  }

  type LeaderboardEntry {
    rank: Int!
    agent: Agent!
  }

  type AgentConnection {
    edges: [AgentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AgentEdge {
    node: Agent!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type Query {
    agent(id: ID!): Agent
    agentByWallet(wallet: String!): Agent
    agents(
      tier: Tier
      agentType: AgentType
      minScore: Int
      maxScore: Int
      capabilities: [String!]
      search: String
      sortBy: String
      sortOrder: String
      limit: Int
      offset: Int
    ): AgentConnection!
    leaderboard(limit: Int): [LeaderboardEntry!]!
    
    task(id: ID!): Task
    tasks(
      agentId: ID
      poster: String
      status: TaskStatus
      limit: Int
      offset: Int
    ): [Task!]!
    
    dispute(id: ID!): Dispute
    disputes(
      status: DisputeStatus
      limit: Int
      offset: Int
    ): [Dispute!]!
    
    proposals(active: Boolean): [Proposal!]!
    
    fleetByOperator(operator: String!): Fleet
    fleetStats(operator: String!): FleetStats
    
    agentAnomalies(agentId: ID!, limit: Int): [AnomalyAlert!]!
    fleetAnomalies(operator: String!, limit: Int): [AnomalyAlert!]!
    
    agentCount: Int!
    taskCount: Int!
    disputeCount: Int!
  }

  input RegisterAgentInput {
    agentWallet: String!
    displayName: String!
    description: String
    avatar: String
    agentType: AgentType!
    subType: Int
    specializations: [String!]
    tier: Tier!
    metadata: String
  }

  input UpdateAgentInput {
    displayName: String
    description: String
    avatar: String
    specializations: [String!]
  }

  input CreateTaskInput {
    agentId: ID!
    title: String!
    description: String
    requirements: String
    usdcAmount: Float!
    deadline: String!
    preferredTier: Tier
  }

  input SubmitCompletionInput {
    taskId: ID!
    completionProof: String!
    notes: String
  }

  input RaiseDisputeInput {
    taskId: ID!
    reason: String!
    evidence: String
  }

  input CastVoteInput {
    disputeId: ID!
    decision: DisputeResolution!
    reasoning: String!
  }

  input ConfigureFleetInput {
    maxSubAgents: Int!
    minTierForDelegation: Int
    maxDelegationDepth: Int
    autoOptimization: Boolean
  }

  type RegisterResult {
    success: Boolean!
    agent: Agent
    tokenId: String
    txHash: String
  }

  type TransactionResult {
    success: Boolean!
    txHash: String
    message: String
  }

  type Mutation {
    registerAgent(input: RegisterAgentInput!): RegisterResult!
    updateAgent(id: ID!, input: UpdateAgentInput!): Agent!
    upgradeTier(agentId: ID!, targetTier: Tier!): TransactionResult!
    deactivateAgent(agentId: ID!): TransactionResult!
    reactivateAgent(agentId: ID!): TransactionResult!
    
    configureFleet(agentId: ID!, input: ConfigureFleetInput!): FleetInfo!
    addSubAgent(agentId: ID!, subAgentWallet: String!): Boolean!
    removeSubAgent(agentId: ID!, subAgentWallet: String!): Boolean!
    
    createTask(input: CreateTaskInput!): Task!
    acceptTask(taskId: ID!): TransactionResult!
    submitCompletion(input: SubmitCompletionInput!): TransactionResult!
    requestVerification(taskId: ID!): String!
    cancelTask(taskId: ID!): TransactionResult!
    
    raiseDispute(input: RaiseDisputeInput!): Dispute!
    castVote(input: CastVoteInput!): TransactionResult!
    
    submitDisputeEvidence(disputeId: ID!, evidence: String!): Boolean!
    
    acknowledgeAnomaly(anomalyId: ID!): AnomalyAlert!
    
    castProposalVote(proposalId: ID!, support: Boolean!): TransactionResult!
  }

  type Subscription {
    taskStatusChanged(taskId: ID!): Task!
    newLeaderboardEntry: LeaderboardEntry!
    anomalyDetected(agentId: ID): AnomalyAlert!
    disputeVoteCast(disputeId: ID!): JurorVote!
  }
`;
