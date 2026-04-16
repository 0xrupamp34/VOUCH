import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { redis, redisKeys, getCache, setCache } from "../../config/redis";
import { config } from "../../config/env";
import { UnauthorizedError, ValidationError, RateLimitError } from "../../utils/errors";

const router = Router();

const KYA_RATE_LIMIT = {
  standard: 60,
  enterprise: 600,
};

async function kyaAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers[config.kya.apiKeyHeader.toLowerCase()] as string;

  if (!apiKey) {
    return next(new UnauthorizedError("API key required"));
  }

  try {
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
    });

    if (!apiKeyRecord || apiKeyRecord.expiresAt || apiKeyRecord.expiresAt < new Date()) {
      throw new UnauthorizedError("Invalid or expired API key");
    }

    const remaining = await redis.incr(`kya:ratelimit:${apiKey}`);
    await redis.expire(`kya:ratelimit:${apiKey}`, 60);

    const limit = apiKeyRecord.rateLimit || KYA_RATE_LIMIT.standard;

    if (remaining > limit) {
      throw new RateLimitError("Rate limit exceeded");
    }

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { requestsUsed: { increment: 1 }, lastUsedAt: new Date() },
    });

    req.headers["x-api-key-id"] = apiKeyRecord.id;
    next();
  } catch (error) {
    next(error);
  }
}

router.use(kyaAuth);

router.get("/agents/:wallet/score", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = req.params;

    const cacheKey = redisKeys.agentScore(wallet);
    const cached = await getCache(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: wallet.toLowerCase() },
      select: {
        tokenId: true,
        tier: true,
        ewmaScore: true,
        rawScore: true,
        tasksCompleted: true,
        tasksFailed: true,
        isActive: true,
        registeredAt: true,
      },
    });

    if (!agent) {
      return res.json({
        isVouched: false,
        message: "Agent not found",
      });
    }

    const result = {
      agentWallet: wallet,
      tokenId: agent.tokenId.toString(),
      isVouched: agent.isActive,
      score: {
        ewma: agent.ewmaScore,
        raw: agent.rawScore,
        tier: agent.tier,
        tierLabel: agent.tier,
      },
      performance: {
        tasksCompleted: agent.tasksCompleted,
        tasksFailed: agent.tasksFailed,
        winRate:
          agent.tasksCompleted + agent.tasksFailed > 0
            ? agent.tasksCompleted / (agent.tasksCompleted + agent.tasksFailed)
            : 0,
      },
      verification: {
        verified: true,
        lastVerifiedAt: agent.registeredAt.toISOString(),
        verificationLevel: "basic",
      },
      metadata: {
        asOf: new Date().toISOString(),
        sourceChain: "base",
        confidence: 95,
      },
    };

    await setCache(cacheKey, result, 5);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/agents/:wallet/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({
        found: false,
        message: "Agent not found",
      });
    }

    const recentHistory = await prisma.reputationHistory.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({
      found: true,
      data: {
        agentWallet: agent.agentAddr,
        tokenId: agent.tokenId.toString(),
        identity: {
          displayName: agent.displayName,
          description: agent.description,
          avatarUrl: agent.avatarIpfs ? `https://ipfs.io/ipfs/${agent.avatarIpfs}` : null,
          registeredAt: agent.registeredAt.toISOString(),
          isActive: agent.isActive,
        },
        classification: {
          type: agent.agentType,
          subType: agent.subType,
          specializations: agent.specializations,
        },
        reputation: {
          tier: agent.tier,
          tierLabel: agent.tier,
          ewmaScore: agent.ewmaScore,
          rawScore: agent.rawScore,
        },
        performance: {
          tasksCompleted: agent.tasksCompleted,
          tasksFailed: agent.tasksFailed,
          winRate:
            agent.tasksCompleted + agent.tasksFailed > 0
              ? agent.tasksCompleted / (agent.tasksCompleted + agent.tasksFailed)
              : 0,
          avgQualityScore: 0,
          totalUsdcProcessed: agent.totalUsdcProcessed.toString(),
        },
        recentHistory: recentHistory.map((h) => ({
          delta: h.delta,
          reason: h.reason,
          timestamp: h.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/agents/:wallet/vouched", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: wallet.toLowerCase() },
      select: { isActive: true, tier: true, ewmaScore: true },
    });

    if (!agent) {
      return res.json({ vouched: false, reason: "Agent not found" });
    }

    res.json({
      vouched: agent.isActive,
      tier: agent.tier,
      score: agent.ewmaScore,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/agents/:wallet/history", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ found: false });
    }

    const history = await prisma.reputationHistory.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.reputationHistory.count({ where: { agentId: agent.id } });

    res.json({
      agentWallet: wallet,
      asOf: new Date().toISOString(),
      entries: history.map((h) => ({
        id: h.id,
        delta: h.delta,
        newScore: h.newScore,
        reason: h.reason,
        reasonLabel: h.reason.replace(/_/g, " "),
        taskId: h.taskId,
        timestamp: h.createdAt.toISOString(),
        transactionHash: h.txHash,
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

router.post("/verify/batch", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agents } = req.body;

    if (!agents || !Array.isArray(agents) || agents.length > 100) {
      throw new ValidationError("Invalid batch request (max 100 agents)");
    }

    const results = await Promise.all(
      agents.map(async (item: { wallet: string }) => {
        const agent = await prisma.agent.findUnique({
          where: { agentAddr: item.wallet.toLowerCase() },
          select: { isActive: true, tier: true, ewmaScore: true },
        });

        return {
          wallet: item.wallet,
          found: !!agent,
          data: agent
            ? {
                isVouched: agent.isActive,
                tier: agent.tier,
                score: agent.ewmaScore,
              }
            : null,
        };
      })
    );

    const summary = {
      total: results.length,
      found: results.filter((r) => r.found).length,
      notFound: results.filter((r) => !r.found).length,
      errors: 0,
    };

    res.json({
      results,
      summary,
      metadata: {
        processingTimeMs: 0,
        asOf: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as kyaRouter };
