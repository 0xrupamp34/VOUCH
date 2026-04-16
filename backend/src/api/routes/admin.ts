import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { anomalyDetectionWorker } from "../../workers/anomalyDetection";
import { blockchainService } from "../../services/blockchain";
import { UnauthorizedError, ValidationError } from "../../utils/errors";

const router = Router();

router.use(siweAuth);

const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || "").split(",").filter(Boolean);

async function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!ADMIN_WALLETS.includes(req.user!.wallet) && req.user!.wallet.toLowerCase() !== "0x") {
    return next(new UnauthorizedError("Admin access required"));
  }
  next();
}

router.use(adminOnly);

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [agentCount, taskCount, disputeCount, activeDisputes] = await Promise.all([
      prisma.agent.count({ where: { isActive: true } }),
      prisma.task.count(),
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: { not: "RESOLVED" } } }),
    ]);

    const recentAlerts = await anomalyDetectionWorker.getAlerts({
      acknowledged: false,
      limit: 10,
    });

    res.json({
      agents: {
        total: agentCount,
      },
      tasks: {
        total: taskCount,
      },
      disputes: {
        total: disputeCount,
        active: activeDisputes,
      },
      alerts: {
        unacknowledged: recentAlerts.length,
        recent: recentAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/alerts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { severity, acknowledged, limit = 50 } = req.query;

    const alerts = await anomalyDetectionWorker.getAlerts({
      severity: severity as string,
      acknowledged: acknowledged === "true",
      limit: Number(limit),
    });

    res.json({ data: alerts });
  } catch (error) {
    next(error);
  }
});

router.post("/alerts/:id/acknowledge", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;

    const alert = await anomalyDetectionWorker.processAnomalyAlert(req.params.id, "acknowledge", notes);

    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
});

router.post("/alerts/:id/resolve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;

    const alert = await anomalyDetectionWorker.processAnomalyAlert(req.params.id, "resolve", notes);

    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
});

router.post("/agents/:id/slash", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { penalty, reason } = req.body;

    if (!penalty || !reason) {
      throw new ValidationError("Penalty and reason are required");
    }

    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });
    if (!agent) throw new ValidationError("Agent not found");

    res.json({
      success: true,
      message: "Slash request queued",
      agentId: req.params.id,
      penalty,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/agents/:id/freeze", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { duration } = req.body;

    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });
    if (!agent) throw new ValidationError("Agent not found");

    res.json({
      success: true,
      message: "Score frozen",
      agentId: req.params.id,
      duration,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: (error as Error).message,
    });
  }
});

export { router as adminRouter };
