import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { logger } from "../../utils/logger";
import { crossChainBridgeService } from "../../services/crossChainBridge";
import { z } from "zod";

const router = Router();

const bridgeSchema = z.object({
  targetChain: z.number().int().min(1),
});

router.get("/chains", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chains = await crossChainBridgeService.getSupportedChains();

    res.json({
      success: true,
      chains,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chainId } = req.query;

    if (chainId) {
      const stats = await crossChainBridgeService.getChainStats(Number(chainId));
      return res.json({
        success: true,
        stats,
      });
    }

    const dashboard = await crossChainBridgeService.getBridgeDashboard();

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/bridge", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = bridgeSchema.parse(req.body);

    const result = await crossChainBridgeService.bridgeReputation(
      req.user!.wallet,
      validated.targetChain
    );

    logger.info(`Reputation bridge initiated`, {
      wallet: req.user!.wallet,
      targetChain: validated.targetChain,
    });

    res.json({
      success: true,
      bridge: result.bridgeRecord,
      txHash: result.txHash,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    next(error);
  }
});

router.get("/bridges", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bridges = await crossChainBridgeService.getBridgeRecords(req.user!.wallet);

    res.json({
      success: true,
      bridges,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/sync", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetChain } = req.body;

    const result = await crossChainBridgeService.syncScore(
      req.user!.wallet,
      targetChain
    );

    logger.info(`Score sync initiated`, {
      wallet: req.user!.wallet,
      targetChain,
    });

    res.json({
      success: true,
      sync: result.syncRecord,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/deactivate", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetChain } = req.body;

    const result = await crossChainBridgeService.deactivateBridge(
      req.user!.wallet,
      targetChain
    );

    logger.info(`Bridge deactivated`, {
      wallet: req.user!.wallet,
      targetChain,
    });

    res.json({
      success: true,
      message: "Bridge deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/verify/:targetChain", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetChain = Number(req.params.targetChain);

    const verification = await crossChainBridgeService.verifyReputation(
      req.user!.wallet,
      targetChain
    );

    res.json({
      success: true,
      verification,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/canonical-score", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const score = await crossChainBridgeService.getCanonicalScore(req.user!.wallet);

    res.json({
      success: true,
      score,
      chain: "Base (8453)",
    });
  } catch (error) {
    next(error);
  }
});

export { router as crossChainRouter };
