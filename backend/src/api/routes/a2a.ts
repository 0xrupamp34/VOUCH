import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { logger } from "../../utils/logger";
import { blockchainService } from "../../services/blockchain";
import { z } from "zod";

const router = Router();

const AGENT_SKILLS: Record<string, string> = {
  code_generation: "0x11",
  code_review: "0x12",
  research: "0x13",
  data_processing: "0x14",
  communication: "0x15",
  design: "0x16",
  planning: "0x17",
  analysis: "0x18",
  testing: "0x19",
  deployment: "0x1a",
};

interface A2AAgentCard {
  name: string;
  version: string;
  capabilities: string[];
  endpoints: {
    protocol: string;
    url: string;
  }[];
  skills: string[];
  metadata: {
    tier: string;
    score: number;
    tasksCompleted: number;
    winRate: number;
    specializations: string[];
  };
}

router.post("/a2a/agent-card", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, capabilities, skills } = req.body;

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const totalTasks = agent.tasksCompleted + agent.tasksFailed;
    const winRate = totalTasks > 0 ? (agent.tasksCompleted / totalTasks) * 100 : 0;

    const agentCard: A2AAgentCard = {
      name: agent.displayName,
      version: "1.0.0",
      capabilities: capabilities || [],
      endpoints: [
        {
          protocol: "a2a",
          url: endpoint,
        },
      ],
      skills: skills || agent.specializations,
      metadata: {
        tier: agent.tier,
        score: agent.ewmaScore,
        tasksCompleted: agent.tasksCompleted,
        winRate,
        specializations: agent.specializations,
      },
    };

    logger.info(`A2A Agent Card registered for: ${agent.agentAddr}`, { endpoint, capabilities });

    res.json({
      success: true,
      agentCard,
      registeredAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/a2a/discover", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { capability, minTier, minScore, limit = 20 } = req.query;

    const where: any = { isActive: true };

    if (minTier) {
      const tierOrder = ["UNRANKED", "BRONZE", "SILVER", "GOLD", "PLATINUM"];
      const tierIndex = tierOrder.indexOf(minTier as string);
      if (tierIndex >= 0) {
        where.tier = { in: tierOrder.slice(tierIndex) };
      }
    }

    if (minScore) {
      where.ewmaScore = { gte: Number(minScore) };
    }

    if (capability) {
      where.specializations = { has: capability as string };
    }

    const agents = await prisma.agent.findMany({
      where,
      orderBy: { ewmaScore: "desc" },
      take: Number(limit),
    });

    const agentCards = await Promise.all(
      agents.map(async (agent) => {
        const totalTasks = agent.tasksCompleted + agent.tasksFailed;
        return {
          name: agent.displayName,
          version: "1.0.0",
          wallet: agent.agentAddr,
          capabilities: agent.specializations,
          endpoints: [
            {
              protocol: "a2a",
              url: `/a2a/agent/${agent.agentAddr}`,
            },
          ],
          metadata: {
            tier: agent.tier,
            score: agent.ewmaScore,
            tasksCompleted: agent.tasksCompleted,
            winRate: totalTasks > 0 ? (agent.tasksCompleted / totalTasks) * 100 : 0,
            specializations: agent.specializations,
          },
        };
      })
    );

    res.json({
      agents: agentCards,
      count: agentCards.length,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/a2a/send-task", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetAgentWallet, taskId, taskType, requirements, deadline } = req.body;

    const fromAgent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    const toAgent = await prisma.agent.findUnique({
      where: { agentAddr: targetAgentWallet.toLowerCase() },
    });

    if (!fromAgent || !toAgent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    if (!toAgent.isActive) {
      return res.status(400).json({ error: "Target agent is not active" });
    }

    const delegationRecord = await prisma.delegation.create({
      data: {
        fromAgentId: fromAgent.id,
        toAgentId: toAgent.id,
        taskId: taskId || `delegated-${Date.now()}`,
        taskType,
        status: "PENDING",
        requirements,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    logger.info(`A2A task sent: ${fromAgent.agentAddr} -> ${toAgent.agentAddr}`, {
      taskId: delegationRecord.taskId,
      taskType,
    });

    res.json({
      success: true,
      delegation: {
        id: delegationRecord.id,
        from: fromAgent.agentAddr,
        to: toAgent.agentAddr,
        taskId: delegationRecord.taskId,
        taskType,
        status: delegationRecord.status,
        createdAt: delegationRecord.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/a2a/accept-task", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { delegationId } = req.body;

    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId },
      include: { toAgent: true },
    });

    if (!delegation) {
      return res.status(404).json({ error: "Delegation not found" });
    }

    if (delegation.toAgent.agentAddr.toLowerCase() !== req.user!.wallet.toLowerCase()) {
      return res.status(403).json({ error: "Not authorized to accept this task" });
    }

    if (delegation.status !== "PENDING") {
      return res.status(400).json({ error: "Task is not pending" });
    }

    const updated = await prisma.delegation.update({
      where: { id: delegationId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    logger.info(`A2A task accepted: ${delegation.taskId}`);

    res.json({
      success: true,
      delegation: updated,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/a2a/reject-task", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { delegationId, reason } = req.body;

    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId },
      include: { toAgent: true },
    });

    if (!delegation) {
      return res.status(404).json({ error: "Delegation not found" });
    }

    if (delegation.toAgent.agentAddr.toLowerCase() !== req.user!.wallet.toLowerCase()) {
      return res.status(403).json({ error: "Not authorized to reject this task" });
    }

    const updated = await prisma.delegation.update({
      where: { id: delegationId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        rejectedAt: new Date(),
      },
    });

    res.json({
      success: true,
      delegation: updated,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/a2a/complete-task", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { delegationId, completionProof } = req.body;

    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId },
      include: { toAgent: true },
    });

    if (!delegation) {
      return res.status(404).json({ error: "Delegation not found" });
    }

    if (delegation.toAgent.agentAddr.toLowerCase() !== req.user!.wallet.toLowerCase()) {
      return res.status(403).json({ error: "Not authorized to complete this task" });
    }

    const ipfsHash = completionProof
      ? await blockchainService.uploadToIPFS({
          proof: completionProof,
          taskId: delegation.taskId,
          completedBy: req.user!.wallet,
          timestamp: new Date().toISOString(),
        })
      : null;

    const updated = await prisma.delegation.update({
      where: { id: delegationId },
      data: {
        status: "COMPLETED",
        completionProof: ipfsHash,
        completedAt: new Date(),
      },
    });

    logger.info(`A2A task completed: ${delegation.taskId}`);

    res.json({
      success: true,
      delegation: updated,
      completionProof: ipfsHash,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/a2a/fail-task", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { delegationId, failureReason } = req.body;

    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId },
      include: { toAgent: true, fromAgent: true },
    });

    if (!delegation) {
      return res.status(404).json({ error: "Delegation not found" });
    }

    if (delegation.toAgent.agentAddr.toLowerCase() !== req.user!.wallet.toLowerCase()) {
      return res.status(403).json({ error: "Not authorized to report failure" });
    }

    const updated = await prisma.delegation.update({
      where: { id: delegationId },
      data: {
        status: "FAILED",
        failureReason,
        failedAt: new Date(),
      },
    });

    logger.warn(`A2A task failed: ${delegation.taskId}`, { reason: failureReason });

    res.json({
      success: true,
      delegation: updated,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/a2a/delegations", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, role = "any", limit = 20, offset = 0 } = req.query;

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const where: any = {};

    if (role === "delegator") {
      where.fromAgentId = agent.id;
    } else if (role === "delegate") {
      where.toAgentId = agent.id;
    } else {
      where.OR = [{ fromAgentId: agent.id }, { toAgentId: agent.id }];
    }

    if (status) {
      where.status = status;
    }

    const delegations = await prisma.delegation.findMany({
      where,
      include: {
        fromAgent: {
          select: { agentAddr: true, displayName: true, tier: true, ewmaScore: true },
        },
        toAgent: {
          select: { agentAddr: true, displayName: true, tier: true, ewmaScore: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json({
      delegations: delegations.map((d) => ({
        id: d.id,
        taskId: d.taskId,
        taskType: d.taskType,
        status: d.status,
        from: d.fromAgent,
        to: d.toAgent,
        createdAt: d.createdAt,
        deadline: d.deadline,
        completedAt: d.completedAt,
        failureReason: d.failureReason,
      })),
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/a2a/agent/:wallet", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.params.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const totalTasks = agent.tasksCompleted + agent.tasksFailed;

    res.json({
      name: agent.displayName,
      version: "1.0.0",
      wallet: agent.agentAddr,
      capabilities: agent.specializations,
      endpoints: [
        {
          protocol: "a2a",
          url: `/a2a/agent/${agent.agentAddr}`,
        },
      ],
      metadata: {
        tier: agent.tier,
        score: agent.ewmaScore,
        tasksCompleted: agent.tasksCompleted,
        winRate: totalTasks > 0 ? (agent.tasksCompleted / totalTasks) * 100 : 0,
        specializations: agent.specializations,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/a2a/negotiate", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { delegationId, proposedTerms } = req.body;

    const delegation = await prisma.delegation.findUnique({
      where: { id: delegationId },
      include: { fromAgent: true, toAgent: true },
    });

    if (!delegation) {
      return res.status(404).json({ error: "Delegation not found" });
    }

    const isParticipant =
      delegation.fromAgent.agentAddr.toLowerCase() === req.user!.wallet.toLowerCase() ||
      delegation.toAgent.agentAddr.toLowerCase() === req.user!.wallet.toLowerCase();

    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized to negotiate this task" });
    }

    const negotiation = await prisma.delegationNegotiation.create({
      data: {
        delegationId,
        proposedBy: req.user!.wallet,
        proposedTerms,
        status: "PROPOSED",
      },
    });

    res.json({
      success: true,
      negotiation,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/a2a/negotiate/:id/respond", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accept, counterTerms } = req.body;

    const negotiation = await prisma.delegationNegotiation.findUnique({
      where: { id: req.params.id },
      include: { delegation: true },
    });

    if (!negotiation) {
      return res.status(404).json({ error: "Negotiation not found" });
    }

    if (negotiation.proposedBy.toLowerCase() === req.user!.wallet.toLowerCase()) {
      return res.status(400).json({ error: "Cannot respond to your own proposal" });
    }

    const updated = await prisma.delegationNegotiation.update({
      where: { id: req.params.id },
      data: {
        status: accept ? "ACCEPTED" : "COUNTERED",
        respondedAt: new Date(),
        counterTerms: accept ? undefined : counterTerms,
      },
    });

    res.json({
      success: true,
      negotiation: updated,
    });
  } catch (error) {
    next(error);
  }
});

export { router as a2aRouter };
