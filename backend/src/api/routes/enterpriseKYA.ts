import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { logger } from "../../utils/logger";
import { enterpriseKyaService } from "../../services/enterpriseKYA";
import { z } from "zod";

const router = Router();

router.get("/tiers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = await enterpriseKyaService.getTiers();

    res.json({
      success: true,
      tiers,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/tiers/:tier", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tier = await enterpriseKyaService.getTier(req.params.tier);

    if (!tier) {
      return res.status(404).json({ error: "Tier not found" });
    }

    res.json({
      success: true,
      tier,
    });
  } catch (error) {
    next(error);
  }
});

const subscribeSchema = z.object({
  tier: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE", "UNLIMITED"]),
  companyName: z.string().min(2).max(100),
});

router.post("/subscribe", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = subscribeSchema.parse(req.body);

    const result = await enterpriseKyaService.subscribe(
      req.user!.wallet,
      validated.tier,
      validated.companyName
    );

    logger.info(`Enterprise subscription created`, {
      wallet: req.user!.wallet,
      tier: validated.tier,
    });

    res.json({
      success: true,
      client: result.client,
      apiKey: {
        keyId: result.apiKey?.keyId,
        key: result.apiKey?.keyHash,
        tier: result.apiKey?.tier,
        createdAt: result.apiKey?.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    next(error);
  }
});

router.get("/client", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientInfo = await enterpriseKyaService.getClientInfo(req.user!.wallet);

    res.json({
      success: true,
      client: clientInfo.client,
      apiKeys: clientInfo.apiKeys.map((k) => ({
        keyId: k.keyId,
        tier: k.tier,
        active: k.active,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
        usageCount: k.usageCount,
      })),
      usage: clientInfo.usage,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/keys", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tier } = req.body;

    const apiKey = await enterpriseKyaService.createAPIKey(
      req.user!.wallet,
      tier || "STARTER"
    );

    logger.info(`API key created`, { wallet: req.user!.wallet, tier });

    res.json({
      success: true,
      apiKey: {
        keyId: apiKey.keyId,
        key: apiKey.keyHash,
        tier: apiKey.tier,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/keys/:keyId", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await enterpriseKyaService.revokeAPIKey(req.params.keyId, req.user!.wallet);

    logger.info(`API key revoked`, { wallet: req.user!.wallet, keyId: req.params.keyId });

    res.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/cancel", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await enterpriseKyaService.cancelSubscription(req.user!.wallet);

    logger.info(`Subscription cancelled`, { wallet: req.user!.wallet });

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/usage", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usage = await enterpriseKyaService.getUsageStats(req.user!.wallet);

    res.json({
      success: true,
      usage,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/sla", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sla = await enterpriseKyaService.getSLACompliance(req.user!.wallet);

    res.json({
      success: true,
      sla,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/verify/:agentWallet", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      return res.status(401).json({ error: "API key required" });
    }

    const validation = await enterpriseKyaService.validateAPIKey(apiKey);
    if (!validation.valid) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    const result = await enterpriseKyaService.verifyAgent(apiKey, req.params.agentWallet);

    res.json({
      success: true,
      agent: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/verify/batch", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      return res.status(401).json({ error: "API key required" });
    }

    const validation = await enterpriseKyaService.validateAPIKey(apiKey);
    if (!validation.valid) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    const { agents } = req.body;

    if (!Array.isArray(agents)) {
      return res.status(400).json({ error: "agents array required" });
    }

    const results = await enterpriseKyaService.batchVerifyAgents(apiKey, agents);

    res.json({
      success: true,
      results: agents.map((wallet: string, i: number) => ({
        wallet,
        verified: results[i],
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/agents/:agentWallet/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      return res.status(401).json({ error: "API key required" });
    }

    const validation = await enterpriseKyaService.validateAPIKey(apiKey);
    if (!validation.valid) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    const profile = await enterpriseKyaService.getAgentProfile(apiKey, req.params.agentWallet);

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
});

export { router as enterpriseKyaRouter };
