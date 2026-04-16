import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { verifySignature } from "../../middleware/auth";
import { verificationWorker } from "../../workers/verification";
import { logger } from "../../utils/logger";
import crypto from "crypto";

const router = Router();

router.post("/locus/completion", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers["x-locus-signature"] as string;
    const webhookSecret = process.env.WEBHOOK_SECRET || "";

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { taskId, status, qualityScore, completedAt, deadline, completionHash } = req.body;

    logger.info(`Locus completion webhook received for task ${taskId}`);

    const task = await prisma.task.findUnique({ where: { taskId } });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (status === "completed" || status === "partial") {
      await prisma.task.update({
        where: { taskId },
        data: {
          status: "VERIFIED",
          qualityScore,
          completedAt: new Date(completedAt),
          completionIpfs: completionHash,
        },
      });
    } else {
      await prisma.task.update({
        where: { taskId },
        data: {
          status: "FAILED",
          completedAt: new Date(completedAt),
        },
      });
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

router.post("/chainlink/callback", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId, response } = req.body;

    logger.info(`Chainlink callback received for request ${requestId}`);

    const responseBytes = Buffer.from(response, "hex");

    await verificationWorker.handleOracleCallback(requestId, new Uint8Array(responseBytes));

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

router.post("/slack/interact", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, user, actions } = req.body;

    if (type === "block_actions") {
      const action = actions[0];
      const actionValue = JSON.parse(action.value);

      logger.info(`Slack interaction: ${action.action_id}`, actionValue);

      res.json({});
    } else {
      res.json({});
    }
  } catch (error) {
    next(error);
  }
});

export { router as webhooksRouter };
