import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { logger } from "../../utils/logger";
import { blockchainService } from "../../services/blockchain";
import { z } from "zod";

const router = Router();

const CAPABILITY_HASHES: Record<string, string> = {
  code_generation: "0x1234...",
  code_review: "0x2345...",
  research: "0x3456...",
  data_processing: "0x4567...",
  communication: "0x5678...",
  design: "0x6789...",
  planning: "0x7890...",
  analysis: "0x8901...",
};

router.post("/mcp/register", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, capabilities } = req.body;

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const capabilityHashes = capabilities.map((cap: string) => CAPABILITY_HASHES[cap] || "0x0000");

    logger.info(`MCP agent registered: ${agent.agentAddr}`, { endpoint, capabilities });

    res.json({
      success: true,
      agentWallet: agent.agentAddr,
      endpoint,
      capabilities,
      registeredAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/mcp/verify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentWallet, protocol } = req.body;

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: agentWallet.toLowerCase() },
    });

    if (!agent) {
      return res.json({
        isVerified: false,
        isCompatible: false,
        reason: "Agent not registered",
      });
    }

    res.json({
      isVerified: agent.isActive,
      isCompatible: agent.isActive,
      agent: {
        wallet: agent.agentAddr,
        tier: agent.tier,
        score: agent.ewmaScore,
        tasksCompleted: agent.tasksCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/mcp/agents", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { capability, minTier, minScore, limit = 20 } = req.query;

    const where: any = {
      isActive: true,
    };

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
      where.specializations = { has: capability };
    }

    const agents = await prisma.agent.findMany({
      where,
      orderBy: { ewmaScore: "desc" },
      take: Number(limit),
      select: {
        agentAddr: true,
        displayName: true,
        agentType: true,
        tier: true,
        ewmaScore: true,
        tasksCompleted: true,
        specializations: true,
      },
    });

    res.json({
      agents: agents.map((a) => ({
        wallet: a.agentAddr,
        name: a.displayName,
        type: a.agentType,
        tier: a.tier,
        score: a.ewmaScore,
        tasksCompleted: a.tasksCompleted,
        capabilities: a.specializations,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/mcp/delegate", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromAgentWallet, toAgentWallet, taskId, capability } = req.body;

    const fromAgent = await prisma.agent.findUnique({
      where: { agentAddr: fromAgentWallet.toLowerCase() },
    });

    const toAgent = await prisma.agent.findUnique({
      where: { agentAddr: toAgentWallet.toLowerCase() },
    });

    if (!fromAgent || !toAgent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    if (!toAgent.specializations.includes(capability)) {
      return res.status(400).json({ error: "Target agent lacks required capability" });
    }

    if (toAgent.ewmaScore < fromAgent.ewmaScore / 2) {
      return res.status(400).json({ error: "Target agent reputation too low" });
    }

    logger.info(`Task delegated: ${fromAgentWallet} -> ${toAgentWallet}`, { taskId, capability });

    res.json({
      success: true,
      delegation: {
        from: fromAgentWallet,
        to: toAgentWallet,
        taskId,
        capability,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/mcp/tools/vouch_score_query", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentWallet, includeHistory } = req.body;

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: agentWallet.toLowerCase() },
      include: {
        reputationHistory: {
          orderBy: { createdAt: "desc" },
          take: includeHistory ? 10 : 0,
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const totalTasks = agent.tasksCompleted + agent.tasksFailed;

    res.json({
      agentWallet: agent.agentAddr,
      tokenId: agent.tokenId.toString(),
      isVouched: agent.isActive,
      score: {
        ewma: agent.ewmaScore,
        raw: agent.rawScore,
        tier: agent.tier,
      },
      performance: {
        tasksCompleted: agent.tasksCompleted,
        tasksFailed: agent.tasksFailed,
        winRate: totalTasks > 0 ? agent.tasksCompleted / totalTasks : 0,
      },
      history: includeHistory
        ? agent.reputationHistory.map((h) => ({
            delta: h.delta,
            reason: h.reason,
            timestamp: h.createdAt,
          }))
        : [],
    });
  } catch (error) {
    next(error);
  }
});

router.post("/mcp/tools/vouch_task_create", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, requirements, usdcAmount, deadline, preferredTier } = req.body;

    const ipfsHash = requirements
      ? await blockchainService.uploadToIPFS({ requirements })
      : null;

    const usdcAmountBigInt = BigInt(Math.floor(usdcAmount * 1e6));

    const txHash = await blockchainService.createTask({
      poster: req.user!.wallet,
      agentId: "0",
      usdcAmount: usdcAmountBigInt,
      deadline: Math.floor(new Date(deadline).getTime() / 1000),
      title,
      description,
      requirements: requirements,
    });

    res.json({
      success: true,
      taskId: txHash,
      txHash,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/mcp/tools/vouch_completion_submit", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, completionProof, notes } = req.body;

    const ipfsHash = await blockchainService.uploadToIPFS({
      proof: completionProof,
      notes,
      taskId,
    });

    const txHash = await blockchainService.submitCompletion(taskId, ipfsHash);

    res.json({
      success: true,
      taskId,
      completionHash: ipfsHash,
      txHash,
    });
  } catch (error) {
    next(error);
  }
});

export { router as mcpRouter };
