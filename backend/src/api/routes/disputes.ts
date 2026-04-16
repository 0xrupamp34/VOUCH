import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { blockchainService } from "../../services/blockchain";
import { notificationWorker } from "../../workers/notifications";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../utils/errors";
import { z } from "zod";

const router = Router();

const raiseDisputeSchema = z.object({
  reason: z.string().min(10),
  evidence: z.string().optional(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const where: any = {};
    if (status) where.status = String(status);

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        skip: Number(offset),
        include: {
          task: true,
          raisedBy: true,
        },
      }),
      prisma.dispute.count({ where }),
    ]);

    res.json({
      data: disputes,
      pagination: { total, limit: Number(limit), offset: Number(offset), hasMore: Number(offset) + Number(limit) < total },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dispute = await prisma.dispute.findUnique({
      where: { id: req.params.id },
      include: {
        task: true,
        raisedBy: true,
        votes: {
          include: { juror: true },
        },
      },
    });

    if (!dispute) throw new NotFoundError("Dispute");

    res.json(dispute);
  } catch (error) {
    next(error);
  }
});

router.post("/", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, reason, evidence } = raiseDisputeSchema.parse(req.body);

    const task = await prisma.task.findUnique({ where: { taskId } });
    if (!task) throw new NotFoundError("Task");

    if (task.status !== "VERIFIED" && task.status !== "FAILED") {
      throw new ValidationError("Task must be completed or failed to raise a dispute");
    }

    const txHash = await blockchainService.raiseDispute(task.taskId, reason);
    const disputeId = await blockchainService.getDisputeIdFromTx(txHash);

    const agent = await prisma.agent.findUnique({ where: { id: task.agentId } });

    const dispute = await prisma.dispute.create({
      data: {
        disputeId,
        taskId: task.taskId,
        raisedById: task.agentId,
        reason,
        evidencePoster: evidence,
        status: "OPEN",
      },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "DISPUTED" },
    });

    if (agent) {
      notificationWorker.emit("disputeRaised", {
        agentOperator: agent.operatorAddr,
        taskId: task.taskId,
        taskTitle: task.title,
        reason,
      });
    }

    res.status(201).json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/evidence", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { evidence } = req.body;
    const dispute = await prisma.dispute.findUnique({ where: { id: req.params.id } });

    if (!dispute) throw new NotFoundError("Dispute");

    if (dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW") {
      throw new ValidationError("Evidence can only be submitted for open disputes");
    }

    const ipfsHash = evidence
      ? await blockchainService.uploadToIPFS({ evidence, disputeId: dispute.disputeId })
      : null;

    const updated = await prisma.dispute.update({
      where: { id: req.params.id },
      data: {
        status: "UNDER_REVIEW",
        evidenceAgent: ipfsHash,
      },
    });

    res.json({ success: true, dispute: updated });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/votes", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const votes = await prisma.jurorVote.findMany({
      where: { disputeId: req.params.id },
      include: { juror: true },
    });

    res.json({ data: votes });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/vote", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { decision, reasoning } = req.body;
    const dispute = await prisma.dispute.findUnique({ where: { id: req.params.id } });

    if (!dispute) throw new NotFoundError("Dispute");

    if (dispute.status !== "VOTING") {
      throw new ValidationError("Dispute is not in voting phase");
    }

    const existingVote = await prisma.jurorVote.findUnique({
      where: { disputeId_jurorId: { disputeId: dispute.disputeId, jurorId: "" } },
    });

    if (existingVote) {
      throw new ValidationError("Already voted");
    }

    const vote = await prisma.jurorVote.create({
      data: {
        disputeId: dispute.disputeId,
        jurorId: "",
        decision,
        reasoning,
        staked: BigInt(100e18),
        votedAt: new Date(),
      },
    });

    res.json({ success: true, vote });
  } catch (error) {
    next(error);
  }
});

export { router as disputesRouter };
