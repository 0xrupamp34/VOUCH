import { prisma } from "../../config/database";
import { blockchainService } from "../../services/blockchain";
import { logger } from "../../utils/logger";
import { NotFoundError, UnauthorizedError } from "../../utils/errors";

interface Context {
  user?: {
    wallet: string;
  };
  req: any;
}

export const resolvers = {
  Query: {
    agent: async (_: unknown, { id }: { id: string }) => {
      const agent = await prisma.agent.findUnique({ where: { id } });
      return agent;
    },

    agentByWallet: async (_: unknown, { wallet }: { wallet: string }) => {
      const agent = await prisma.agent.findUnique({ where: { agentAddr: wallet } });
      return agent;
    },

    agents: async (
      _: unknown,
      {
        tier,
        agentType,
        minScore,
        maxScore,
        capabilities,
        search,
        sortBy = "ewmaScore",
        sortOrder = "desc",
        limit = 20,
        offset = 0,
      }: {
        tier?: string;
        agentType?: string;
        minScore?: number;
        maxScore?: number;
        capabilities?: string[];
        search?: string;
        sortBy?: string;
        sortOrder?: string;
        limit?: number;
        offset?: number;
      }
    ) => {
      const where: any = {
        isActive: true,
      };

      if (tier) where.tier = tier;
      if (agentType) where.agentType = agentType;
      if (minScore !== undefined) where.ewmaScore = { ...where.ewmaScore, gte: minScore };
      if (maxScore !== undefined) where.ewmaScore = { ...where.ewmaScore, lte: maxScore };
      if (capabilities && capabilities.length > 0) {
        where.specializations = { hasSome: capabilities };
      }
      if (search) {
        where.OR = [
          { displayName: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [agents, totalCount] = await Promise.all([
        prisma.agent.findMany({
          where,
          orderBy,
          take: limit,
          skip: offset,
        }),
        prisma.agent.count({ where }),
      ]);

      return {
        edges: agents.map((agent) => ({
          node: agent,
          cursor: Buffer.from(agent.id).toString("base64"),
        })),
        pageInfo: {
          hasNextPage: offset + limit < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: agents[0]?.id ? Buffer.from(agents[0].id).toString("base64") : null,
          endCursor: agents[agents.length - 1]?.id
            ? Buffer.from(agents[agents.length - 1].id).toString("base64")
            : null,
        },
        totalCount,
      };
    },

    leaderboard: async (_: unknown, { limit = 10 }: { limit?: number }) => {
      const agents = await prisma.agent.findMany({
        where: { isActive: true },
        orderBy: { ewmaScore: "desc" },
        take: limit,
      });

      return agents.map((agent, index) => ({
        rank: index + 1,
        agent,
      }));
    },

    task: async (_: unknown, { id }: { id: string }) => {
      return prisma.task.findUnique({ where: { id } });
    },

    tasks: async (
      _: unknown,
      {
        agentId,
        poster,
        status,
        limit = 20,
        offset = 0,
      }: { agentId?: string; poster?: string; status?: string; limit?: number; offset?: number }
    ) => {
      const where: any = {};
      if (agentId) where.agentId = agentId;
      if (poster) where.posterAddr = poster;
      if (status) where.status = status;

      return prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });
    },

    dispute: async (_: unknown, { id }: { id: string }) => {
      return prisma.dispute.findUnique({ where: { id } });
    },

    disputes: async (
      _: unknown,
      { status, limit = 20, offset = 0 }: { status?: string; limit?: number; offset?: number }
    ) => {
      const where: any = {};
      if (status) where.status = status;

      return prisma.dispute.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });
    },

    fleetByOperator: async (_: unknown, { operator }: { operator: string }) => {
      const agents = await prisma.agent.findMany({
        where: { operatorAddr: operator },
      });

      if (agents.length === 0) return null;

      const stats = calculateFleetStats(agents);

      return {
        operator,
        agents,
        config: {
          maxAgents: 100,
          minTierForDelegation: 1,
          maxDelegationDepth: 3,
          autoOptimization: false,
        },
        stats,
        createdAt: agents[0].createdAt.toISOString(),
      };
    },

    fleetStats: async (_: unknown, { operator }: { operator: string }) => {
      const agents = await prisma.agent.findMany({
        where: { operatorAddr: operator },
      });

      return calculateFleetStats(agents);
    },

    agentAnomalies: async (_: unknown, { agentId, limit = 10 }: { agentId: string; limit?: number }) => {
      return prisma.anomalyAlert.findMany({
        where: { agentId, resolved: false },
        orderBy: { detectedAt: "desc" },
        take: limit,
      });
    },

    agentCount: async () => {
      return prisma.agent.count({ where: { isActive: true } });
    },

    taskCount: async () => {
      return prisma.task.count();
    },

    disputeCount: async () => {
      return prisma.dispute.count({ where: { status: { not: "RESOLVED" } } });
    },
  },

  Mutation: {
    registerAgent: async (_: unknown, { input }: { input: any }, context: Context) => {
      if (!context.user) throw new UnauthorizedError();

      try {
        const txHash = await blockchainService.registerAgent({
          operator: context.user.wallet,
          agentWallet: input.agentWallet,
          agentType: input.agentType,
          metadata: input.metadata,
        });

        const onChainAgent = await blockchainService.getAgentByWallet(input.agentWallet);

        const agent = await prisma.agent.create({
          data: {
            tokenId: BigInt(onChainAgent.tokenId),
            operatorAddr: context.user.wallet,
            agentAddr: input.agentWallet,
            displayName: input.displayName,
            description: input.description,
            agentType: input.agentType,
            subType: input.subType || 0,
            specializations: input.specializations || [],
            tier: input.tier || "UNRANKED",
            metadataIpfs: input.metadata,
          },
        });

        return {
          success: true,
          agent,
          tokenId: onChainAgent.tokenId.toString(),
          txHash,
        };
      } catch (error) {
        logger.error("Agent registration failed:", error);
        return {
          success: false,
          agent: null,
          tokenId: null,
          txHash: null,
        };
      }
    },

    updateAgent: async (_: unknown, { id, input }: { id: string; input: any }, context: Context) => {
      if (!context.user) throw new UnauthorizedError();

      const agent = await prisma.agent.findUnique({ where: { id } });
      if (!agent) throw new NotFoundError("Agent");
      if (agent.operatorAddr !== context.user.wallet) {
        throw new UnauthorizedError("Not agent owner");
      }

      return prisma.agent.update({
        where: { id },
        data: {
          displayName: input.displayName || agent.displayName,
          description: input.description !== undefined ? input.description : agent.description,
          avatarIpfs: input.avatar || agent.avatarIpfs,
          specializations: input.specializations || agent.specializations,
          updatedAt: new Date(),
        },
      });
    },

    upgradeTier: async (
      _: unknown,
      { agentId, targetTier }: { agentId: string; targetTier: string },
      context: Context
    ) => {
      if (!context.user) throw new UnauthorizedError();

      try {
        const txHash = await blockchainService.upgradeTier(agentId, targetTier);
        return { success: true, txHash, message: "Tier upgraded successfully" };
      } catch (error) {
        return { success: false, txHash: null, message: (error as Error).message };
      }
    },

    createTask: async (_: unknown, { input }: { input: any }, context: Context) => {
      if (!context.user) throw new UnauthorizedError();

      try {
        const deadline = new Date(input.deadline);
        if (deadline <= new Date()) {
          throw new Error("Deadline must be in the future");
        }

        const usdcAmount = BigInt(Math.floor(input.usdcAmount * 1e6));

        const txHash = await blockchainService.createTask({
          poster: context.user.wallet,
          agentId: input.agentId,
          usdcAmount,
          deadline: Math.floor(deadline.getTime() / 1000),
          title: input.title,
          description: input.description,
          requirements: input.requirements,
        });

        const taskId = await blockchainService.getTaskIdFromTx(txHash);

        const task = await prisma.task.create({
          data: {
            taskId,
            posterAddr: context.user.wallet,
            agentId: input.agentId,
            amountUsdc: usdcAmount,
            title: input.title,
            description: input.description,
            requirementsIpfs: input.requirements,
            deadline,
            status: "OPEN",
          },
        });

        return task;
      } catch (error) {
        logger.error("Task creation failed:", error);
        throw error;
      }
    },

    acceptTask: async (_: unknown, { taskId }: { taskId: string }, context: Context) => {
      if (!context.user) throw new UnauthorizedError();

      try {
        const txHash = await blockchainService.acceptTask(taskId, context.user.wallet);
        
        await prisma.task.update({
          where: { taskId },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        });

        return { success: true, txHash, message: "Task accepted" };
      } catch (error) {
        return { success: false, txHash: null, message: (error as Error).message };
      }
    },

    submitCompletion: async (
      _: unknown,
      { input }: { input: { taskId: string; completionProof: string; notes?: string } },
      context: Context
    ) => {
      if (!context.user) throw new UnauthorizedError();

      try {
        const ipfsHash = await blockchainService.uploadToIPFS({
          proof: input.completionProof,
          notes: input.notes,
          taskId: input.taskId,
        });

        const txHash = await blockchainService.submitCompletion(input.taskId, ipfsHash);

        await prisma.task.update({
          where: { taskId: input.taskId },
          data: {
            status: "SUBMISSION_PENDING",
            completionIpfs: ipfsHash,
          },
        });

        return { success: true, txHash, message: "Completion submitted" };
      } catch (error) {
        return { success: false, txHash: null, message: (error as Error).message };
      }
    },

    raiseDispute: async (_: unknown, { input }: { input: any }, context: Context) => {
      if (!context.user) throw new UnauthorizedError();

      try {
        const txHash = await blockchainService.raiseDispute(input.taskId, input.reason);

        const disputeId = await blockchainService.getDisputeIdFromTx(txHash);

        const task = await prisma.task.findUnique({ where: { taskId: input.taskId } });
        if (!task) throw new NotFoundError("Task");

        const dispute = await prisma.dispute.create({
          data: {
            disputeId,
            taskId: input.taskId,
            raisedById: task.agentId,
            reason: input.reason,
            evidencePoster: input.evidence,
            status: "OPEN",
          },
        });

        await prisma.task.update({
          where: { taskId: input.taskId },
          data: { status: "DISPUTED" },
        });

        return dispute;
      } catch (error) {
        logger.error("Dispute creation failed:", error);
        throw error;
      }
    },

    acknowledgeAnomaly: async (_: unknown, { anomalyId }: { anomalyId: string }, context: Context) => {
      if (!context.user) throw new UnauthorizedError();

      return prisma.anomalyAlert.update({
        where: { id: anomalyId },
        data: {
          acknowledged: true,
          acknowledgedBy: context.user.wallet,
          acknowledgedAt: new Date(),
        },
      });
    },
  },

  Agent: {
    wallet: (parent: any) => parent.agentAddr,
    operator: (parent: any) => parent.operatorAddr,
    avatarUrl: (parent: any) =>
      parent.avatarIpfs ? `https://ipfs.io/ipfs/${parent.avatarIpfs}` : null,
    tierLabel: (parent: any) => parent.tier,
    winRate: (parent: any) => {
      const total = parent.tasksCompleted + parent.tasksFailed;
      return total > 0 ? parent.tasksCompleted / total : 0;
    },
    disputeWinRate: (parent: any) => {
      const total = parent.disputesRaised;
      return total > 0 ? parent.disputesWon / total : 0;
    },
    totalUsdcProcessed: (parent: any) => parent.totalUsdcProcessed.toString(),
    tierProgress: (parent: any) => {
      const tierThresholds: Record<string, number> = {
        UNRANKED: 0,
        BRONZE: 500,
        SILVER: 2000,
        GOLD: 5000,
        PLATINUM: 8000,
      };

      const currentThreshold = tierThresholds[parent.tier] || 0;
      const nextTier = Object.keys(tierThresholds).find(
        (t) => tierThresholds[t] > parent.ewmaScore
      );

      if (!nextTier) {
        return { current: parent.ewmaScore, required: parent.ewmaScore, percentage: 100, remaining: 0 };
      }

      const nextThreshold = tierThresholds[nextTier];
      const range = nextThreshold - currentThreshold;
      const progress = parent.ewmaScore - currentThreshold;
      const percentage = (progress / range) * 100;

      return {
        current: parent.ewmaScore,
        required: nextThreshold,
        percentage: Math.min(100, Math.max(0, percentage)),
        remaining: nextThreshold - parent.ewmaScore,
      };
    },
    scoreHistory: async (parent: any, { limit = 20 }: { limit?: number }) => {
      return prisma.reputationHistory.findMany({
        where: { agentId: parent.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    },
    tasks: async (parent: any, { status, limit = 20, offset = 0 }: any) => {
      return prisma.task.findMany({
        where: { agentId: parent.id, ...(status ? { status } : {}) },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });
    },
    anomalies: async (parent: any, { limit = 10 }: { limit?: number }) => {
      return prisma.anomalyAlert.findMany({
        where: { agentId: parent.id },
        orderBy: { detectedAt: "desc" },
        take: limit,
      });
    },
  },

  Task: {
    agent: async (parent: any) => {
      return prisma.agent.findUnique({ where: { id: parent.agentId } });
    },
    requirementsUrl: (parent: any) =>
      parent.requirementsIpfs ? `https://ipfs.io/ipfs/${parent.requirementsIpfs}` : null,
    completionUrl: (parent: any) =>
      parent.completionIpfs ? `https://ipfs.io/ipfs/${parent.completionIpfs}` : null,
    amountUsdc: (parent: any) => parent.amountUsdc.toString(),
    deadline: (parent: any) => parent.deadline.toISOString(),
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    acceptedAt: (parent: any) => parent.acceptedAt?.toISOString() || null,
    completedAt: (parent: any) => parent.completedAt?.toISOString() || null,
    subTasks: async (parent: any) => {
      return prisma.subTask.findMany({
        where: { parentTaskId: parent.taskId },
      });
    },
    dispute: async (parent: any) => {
      return prisma.dispute.findFirst({
        where: { taskId: parent.taskId },
      });
    },
  },

  Dispute: {
    task: async (parent: any) => {
      return prisma.task.findUnique({ where: { taskId: parent.taskId } });
    },
    raisedBy: async (parent: any) => {
      return prisma.agent.findUnique({ where: { id: parent.raisedById } });
    },
    votes: async (parent: any) => {
      return prisma.jurorVote.findMany({
        where: { disputeId: parent.disputeId },
      });
    },
  },

  AnomalyAlert: {
    agent: async (parent: any) => {
      return prisma.agent.findUnique({ where: { id: parent.agentId } });
    },
    evidence: (parent: any) => (parent.evidence ? JSON.stringify(parent.evidence) : null),
    detectedAt: (parent: any) => parent.detectedAt.toISOString(),
    acknowledgedAt: (parent: any) => parent.acknowledgedAt?.toISOString() || null,
    resolvedAt: (parent: any) => parent.resolvedAt?.toISOString() || null,
  },

  ScoreEvent: {
    usdcAmount: (parent: any) => parent.usdcAmount?.toString() || null,
    timestamp: (parent: any) => parent.createdAt.toISOString(),
  },
};

function calculateFleetStats(agents: any[]) {
  const activeAgents = agents.filter((a) => a.isActive);
  const totalScore = activeAgents.reduce((sum, a) => sum + a.ewmaScore, 0);
  const totalCompleted = activeAgents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const totalFailed = activeAgents.reduce((sum, a) => sum + a.tasksFailed, 0);
  const totalRevenue = activeAgents.reduce((sum, a) => sum + Number(a.totalUsdcProcessed), BigInt(0));

  return {
    totalAgents: agents.length,
    activeAgents: activeAgents.length,
    aggregateScore: totalScore,
    averageAgentScore: activeAgents.length > 0 ? Math.round(totalScore / activeAgents.length) : 0,
    totalTasksCompleted: totalCompleted,
    totalTasksFailed: totalFailed,
    overallWinRate: totalCompleted + totalFailed > 0 ? totalCompleted / (totalCompleted + totalFailed) : 0,
    totalRevenue: totalRevenue.toString(),
    avgQualityScore: 0,
  };
}
