import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { blockchainService } from "../../services/blockchain";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../utils/errors";
import { z } from "zod";

const router = Router();

const registerAgentSchema = z.object({
  agentWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  displayName: z.string().min(3).max(50),
  description: z.string().optional(),
  avatar: z.string().optional(),
  agentType: z.enum(["LLM_BASED", "RULE_BASED", "HYBRID"]),
  subType: z.number().optional(),
  specializations: z.array(z.string()).optional(),
  tier: z.enum(["UNRANKED", "BRONZE", "SILVER", "GOLD", "PLATINUM"]).optional(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      tier,
      agentType,
      minScore,
      maxScore,
      search,
      limit = 20,
      offset = 0,
    } = req.query;

    const where: any = { isActive: true };

    if (tier) where.tier = tier;
    if (agentType) where.agentType = agentType;
    if (minScore) where.ewmaScore = { ...where.ewmaScore, gte: Number(minScore) };
    if (maxScore) where.ewmaScore = { ...where.ewmaScore, lte: Number(maxScore) };
    if (search) {
      where.OR = [
        { displayName: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy: { ewmaScore: "desc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.agent.count({ where }),
    ]);

    res.json({
      data: agents.map((a) => ({
        ...a,
        wallet: a.agentAddr,
        operator: a.operatorAddr,
        avatarUrl: a.avatarIpfs ? `https://ipfs.io/ipfs/${a.avatarIpfs}` : null,
      })),
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
    });

    if (!agent) throw new NotFoundError("Agent");

    const [tasks, history, anomalies] = await Promise.all([
      prisma.task.findMany({
        where: { agentId: agent.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.reputationHistory.findMany({
        where: { agentId: agent.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.anomalyAlert.findMany({
        where: { agentId: agent.id, resolved: false },
        orderBy: { detectedAt: "desc" },
        take: 5,
      }),
    ]);

    res.json({
      ...agent,
      wallet: agent.agentAddr,
      operator: agent.operatorAddr,
      avatarUrl: agent.avatarIpfs ? `https://ipfs.io/ipfs/${agent.avatarIpfs}` : null,
      winRate:
        agent.tasksCompleted + agent.tasksFailed > 0
          ? agent.tasksCompleted / (agent.tasksCompleted + agent.tasksFailed)
          : 0,
      tasks,
      history,
      anomalies,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/wallet/:wallet", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.params.wallet.toLowerCase() },
    });

    if (!agent) throw new NotFoundError("Agent");

    res.json({
      ...agent,
      wallet: agent.agentAddr,
      operator: agent.operatorAddr,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerAgentSchema.parse(req.body);

    const existing = await prisma.agent.findUnique({
      where: { agentAddr: validated.agentWallet.toLowerCase() },
    });

    if (existing) {
      throw new ValidationError("Agent already registered");
    }

    const onChainAgent = await blockchainService.getAgentByWallet(validated.agentWallet);

    const agent = await prisma.agent.create({
      data: {
        tokenId: BigInt(onChainAgent.tokenId || 0),
        operatorAddr: req.user!.wallet,
        agentAddr: validated.agentWallet.toLowerCase(),
        displayName: validated.displayName,
        description: validated.description,
        agentType: validated.agentType,
        subType: validated.subType || 0,
        specializations: validated.specializations || [],
        tier: validated.tier || "UNRANKED",
        avatarIpfs: validated.avatar,
      },
    });

    res.status(201).json({
      success: true,
      agent: {
        ...agent,
        wallet: agent.agentAddr,
        operator: agent.operatorAddr,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors.map((e) => e.message).join(", ")));
    } else {
      next(error);
    }
  }
});

router.put("/:id", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });

    if (!agent) throw new NotFoundError("Agent");

    if (agent.operatorAddr !== req.user!.wallet) {
      throw new UnauthorizedError("Not authorized to update this agent");
    }

    const { displayName, description, avatar, specializations } = req.body;

    const updated = await prisma.agent.update({
      where: { id: req.params.id },
      data: {
        displayName: displayName || agent.displayName,
        description: description !== undefined ? description : agent.description,
        avatarIpfs: avatar || agent.avatarIpfs,
        specializations: specializations || agent.specializations,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      agent: {
        ...updated,
        wallet: updated.agentAddr,
        operator: updated.operatorAddr,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/history", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const history = await prisma.reputationHistory.findMany({
      where: { agentId: req.params.id },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json({ data: history });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/tasks", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const where: any = { agentId: req.params.id };
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json({ data: tasks });
  } catch (error) {
    next(error);
  }
});

export { router as agentsRouter };
