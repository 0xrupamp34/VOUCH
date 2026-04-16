import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { blockchainService } from "../../services/blockchain";
import { notificationWorker } from "../../workers/notifications";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../utils/errors";
import { z } from "zod";

const router = Router();

const createTaskSchema = z.object({
  agentId: z.string(),
  title: z.string().min(5).max(120),
  description: z.string().optional(),
  requirements: z.string().optional(),
  usdcAmount: z.number().positive().max(10000),
  deadline: z.string().datetime(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, poster, status, limit = 20, offset = 0 } = req.query;

    const where: any = {};
    if (agentId) where.agentId = String(agentId);
    if (poster) where.posterAddr = String(poster);
    if (status) where.status = String(status);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      data: tasks,
      pagination: { total, limit: Number(limit), offset: Number(offset), hasMore: Number(offset) + Number(limit) < total },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });

    if (!task) throw new NotFoundError("Task");

    const [agent, subTasks, dispute] = await Promise.all([
      prisma.agent.findUnique({ where: { id: task.agentId } }),
      prisma.subTask.findMany({ where: { parentTaskId: task.taskId } }),
      task.status === "DISPUTED"
        ? prisma.dispute.findFirst({ where: { taskId: task.taskId } })
        : Promise.resolve(null),
    ]);

    res.json({
      ...task,
      agent,
      subTasks,
      dispute,
      requirementsUrl: task.requirementsIpfs ? `https://ipfs.io/ipfs/${task.requirementsIpfs}` : null,
      completionUrl: task.completionIpfs ? `https://ipfs.io/ipfs/${task.completionIpfs}` : null,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createTaskSchema.parse(req.body);

    const deadline = new Date(validated.deadline);
    if (deadline <= new Date()) {
      throw new ValidationError("Deadline must be in the future");
    }

    const agent = await prisma.agent.findUnique({ where: { id: validated.agentId } });
    if (!agent) throw new NotFoundError("Agent");

    const ipfsHash = validated.requirements
      ? await blockchainService.uploadToIPFS({ requirements: validated.requirements })
      : null;

    const usdcAmount = BigInt(Math.floor(validated.usdcAmount * 1e6));

    const txHash = await blockchainService.createTask({
      poster: req.user!.wallet,
      agentId: validated.agentId,
      usdcAmount,
      deadline: Math.floor(deadline.getTime() / 1000),
      title: validated.title,
      description: validated.description,
      requirements: validated.requirements,
    });

    const taskId = await blockchainService.getTaskIdFromTx(txHash);

    const task = await prisma.task.create({
      data: {
        taskId,
        posterAddr: req.user!.wallet,
        agentId: validated.agentId,
        amountUsdc: usdcAmount,
        title: validated.title,
        description: validated.description,
        requirementsIpfs: ipfsHash,
        deadline,
        status: "OPEN",
        txCreateHash: txHash,
      },
    });

    notificationWorker.emit("taskCreated", {
      agentOperator: agent.operatorAddr,
      taskId,
      taskTitle: validated.title,
      amount: validated.usdcAmount,
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors.map((e) => e.message).join(", ")));
    } else {
      next(error);
    }
  }
});

router.post("/:id/accept", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });

    if (!task) throw new NotFoundError("Task");

    if (task.status !== "OPEN") {
      throw new ValidationError("Task is not open for acceptance");
    }

    const agent = await prisma.agent.findUnique({ where: { id: task.agentId } });
    if (!agent) throw new NotFoundError("Agent");

    if (agent.operatorAddr !== req.user!.wallet) {
      throw new UnauthorizedError("You are not the operator of this agent");
    }

    const txHash = await blockchainService.acceptTask(task.taskId, req.user!.wallet);

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    notificationWorker.emit("taskAccepted", {
      poster: task.posterAddr,
      taskId: task.taskId,
      taskTitle: task.title,
    });

    res.json({ success: true, txHash, task: updated });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/complete", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { completionProof, notes } = req.body;

    if (!completionProof) {
      throw new ValidationError("Completion proof is required");
    }

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });

    if (!task) throw new NotFoundError("Task");

    if (task.status !== "ACCEPTED") {
      throw new ValidationError("Task must be accepted before completion");
    }

    const agent = await prisma.agent.findUnique({ where: { id: task.agentId } });
    if (agent?.operatorAddr !== req.user!.wallet) {
      throw new UnauthorizedError("Not authorized");
    }

    const ipfsHash = await blockchainService.uploadToIPFS({
      proof: completionProof,
      notes,
      taskId: task.taskId,
    });

    const txHash = await blockchainService.submitCompletion(task.taskId, ipfsHash);

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: "SUBMISSION_PENDING",
        completionIpfs: ipfsHash,
      },
    });

    res.json({ success: true, txHash, task: updated });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/verify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });

    if (!task) throw new NotFoundError("Task");

    if (task.status !== "SUBMISSION_PENDING") {
      throw new ValidationError("Task must have pending submission for verification");
    }

    const requestId = await blockchainService.requestVerification(task.taskId);

    await prisma.task.update({
      where: { id: req.params.id },
      data: { status: "VERIFICATION_IN_PROGRESS" },
    });

    res.json({ success: true, requestId });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/cancel", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });

    if (!task) throw new NotFoundError("Task");

    if (task.posterAddr !== req.user!.wallet) {
      throw new UnauthorizedError("Only task poster can cancel");
    }

    if (task.status !== "OPEN") {
      throw new ValidationError("Only open tasks can be cancelled");
    }

    const txHash = "cancel_tx_hash";

    await prisma.task.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });

    res.json({ success: true, txHash });
  } catch (error) {
    next(error);
  }
});

export { router as tasksRouter };
