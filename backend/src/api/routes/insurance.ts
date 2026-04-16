import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { logger } from "../../utils/logger";
import { insuranceService } from "../../services/insurance";
import { blockchainService } from "../../services/blockchain";
import { z } from "zod";

const router = Router();

const purchaseSchema = z.object({
  coverageAmount: z.number().min(1).max(100000),
  durationDays: z.number().min(30).max(365),
});

const claimSchema = z.object({
  policyId: z.string(),
  amount: z.number().min(1),
  taskId: z.string(),
  reason: z.string().min(10),
});

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await insuranceService.getCoverageStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/quote", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { coverageAmount, durationDays, agentWallet } = req.query;

    const targetAgent = agentWallet || req.user!.wallet;

    const quote = await insuranceService.getCoverageQuote(
      targetAgent as string,
      Number(coverageAmount) || 10000,
      Number(durationDays) || 90
    );

    const riskScore = await insuranceService.calculateRiskScore(targetAgent as string);

    res.json({
      success: true,
      quote: {
        ...quote,
        riskScore,
        coverageAmount: Number(coverageAmount) || 10000,
        durationDays: Number(durationDays) || 90,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/purchase", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = purchaseSchema.parse(req.body);

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const quote = await insuranceService.getCoverageQuote(
      req.user!.wallet,
      validated.coverageAmount,
      validated.durationDays
    );

    const txHash = await blockchainService.approveAndCallUSDC(
      req.user!.wallet,
      quote.premium,
      insuranceService as any
    );

    const result = await insuranceService.purchaseCoverage(
      req.user!.wallet,
      validated.coverageAmount,
      validated.durationDays
    );

    const policy = await prisma.insurancePolicy.create({
      data: {
        policyId: BigInt(result.policyId),
        agentId: agent.id,
        coverageAmount: BigInt(Math.floor(validated.coverageAmount * 1e6)),
        premiumPaid: result.premium,
        durationDays: validated.durationDays,
        status: "ACTIVE",
      },
    });

    logger.info(`Insurance policy created in DB: ${policy.id}`, { policyId: result.policyId });

    res.json({
      success: true,
      policy: {
        id: policy.id,
        policyId: result.policyId,
        coverageAmount: validated.coverageAmount,
        premium: quote.premium,
        durationDays: validated.durationDays,
        txHash: result.txHash,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    next(error);
  }
});

router.get("/policies", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const policies = await prisma.insurancePolicy.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      policies: policies.map((p) => ({
        id: p.id,
        policyId: p.policyId.toString(),
        coverageAmount: Number(p.coverageAmount) / 1e6,
        premiumPaid: Number(p.premiumPaid) / 1e6,
        durationDays: p.durationDays,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/policies/:policyId", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await prisma.insurancePolicy.findFirst({
      where: {
        id: req.params.policyId,
        agent: { agentAddr: req.user!.wallet.toLowerCase() },
      },
    });

    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.json({
      success: true,
      policy: {
        id: policy.id,
        policyId: policy.policyId.toString(),
        coverageAmount: Number(policy.coverageAmount) / 1e6,
        premiumPaid: Number(policy.premiumPaid) / 1e6,
        durationDays: policy.durationDays,
        status: policy.status,
        createdAt: policy.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/claims", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = claimSchema.parse(req.body);

    const policy = await prisma.insurancePolicy.findFirst({
      where: {
        policyId: BigInt(validated.policyId),
        status: "ACTIVE",
        agent: { agentAddr: req.user!.wallet.toLowerCase() },
      },
    });

    if (!policy) {
      return res.status(404).json({ error: "Active policy not found" });
    }

    const task = await prisma.task.findFirst({
      where: {
        taskId: validated.taskId,
        agentId: policy.agentId,
        status: { in: ["FAILED", "DISPUTED"] },
      },
    });

    if (!task) {
      return res.status(400).json({ error: "No failed task found with provided taskId" });
    }

    const existingClaim = await prisma.insuranceClaim.findFirst({
      where: {
        taskId: validated.taskId,
        status: { notIn: ["DENIED", "RESOLVED"] },
      },
    });

    if (existingClaim) {
      return res.status(400).json({ error: "Claim already exists for this task" });
    }

    const result = await insuranceService.submitClaim(
      validated.policyId,
      validated.amount,
      validated.taskId,
      validated.reason
    );

    const claim = await prisma.insuranceClaim.create({
      data: {
        claimId: BigInt(result.claimId),
        policyId: policy.id,
        taskId: validated.taskId,
        agentId: policy.agentId,
        claimAmount: BigInt(Math.floor(validated.amount * 1e6)),
        reason: validated.reason,
        status: "SUBMITTED",
      },
    });

    logger.info(`Insurance claim created in DB: ${claim.id}`, { claimId: result.claimId });

    res.json({
      success: true,
      claim: {
        id: claim.id,
        claimId: result.claimId,
        policyId: validated.policyId,
        amount: validated.amount,
        taskId: validated.taskId,
        status: "SUBMITTED",
        txHash: result.txHash,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    next(error);
  }
});

router.get("/claims", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const claims = await prisma.insuranceClaim.findMany({
      where: { agentId: agent.id },
      include: {
        policy: true,
        task: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      claims: claims.map((c) => ({
        id: c.id,
        claimId: c.claimId.toString(),
        policyId: c.policy.policyId.toString(),
        taskId: c.taskId,
        amount: Number(c.claimAmount) / 1e6,
        reason: c.reason,
        status: c.status,
        createdAt: c.createdAt,
        resolvedAt: c.resolvedAt,
        payoutAmount: c.payoutAmount ? Number(c.payoutAmount) / 1e6 : null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/claims/:claimId", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claim = await prisma.insuranceClaim.findFirst({
      where: {
        id: req.params.claimId,
        agent: { agentAddr: req.user!.wallet.toLowerCase() },
      },
      include: {
        policy: true,
        task: true,
      },
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    const onChainClaim = await insuranceService.getClaimDetails(claim.claimId.toString());

    res.json({
      success: true,
      claim: {
        id: claim.id,
        claimId: claim.claimId.toString(),
        policyId: claim.policy.policyId.toString(),
        taskId: claim.taskId,
        amount: Number(claim.claimAmount) / 1e6,
        reason: claim.reason,
        status: onChainClaim.status,
        submittedAt: onChainClaim.submittedAt,
        resolvedAt: onChainClaim.resolvedAt,
        resolutionNotes: claim.resolutionNotes,
        payoutAmount: onChainClaim.payoutAmount,
        onChain: onChainClaim,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/approve-claim", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { claimId, payoutAmount, resolutionNotes } = req.body;

    const claim = await prisma.insuranceClaim.findFirst({
      where: { id: claimId, status: "UNDER_REVIEW" },
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found or not under review" });
    }

    const txHash = await insuranceService.approveClaim(
      claim.claimId.toString(),
      payoutAmount,
      resolutionNotes || "Claim approved"
    );

    await prisma.insuranceClaim.update({
      where: { id: claimId },
      data: {
        status: "APPROVED",
        payoutAmount: BigInt(Math.floor(payoutAmount * 1e6)),
        resolutionNotes,
        resolvedAt: new Date(),
      },
    });

    logger.info(`Insurance claim approved by admin: ${claimId}`);

    res.json({
      success: true,
      claimId,
      payoutAmount,
      txHash,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/deny-claim", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { claimId, reason } = req.body;

    const claim = await prisma.insuranceClaim.findFirst({
      where: { id: claimId, status: "UNDER_REVIEW" },
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found or not under review" });
    }

    const txHash = await insuranceService.denyClaim(claim.claimId.toString(), reason);

    await prisma.insuranceClaim.update({
      where: { id: claimId },
      data: {
        status: "DENIED",
        resolutionNotes: reason,
        resolvedAt: new Date(),
      },
    });

    logger.warn(`Insurance claim denied by admin: ${claimId}`, { reason });

    res.json({
      success: true,
      claimId,
      txHash,
    });
  } catch (error) {
    next(error);
  }
});

export { router as insuranceRouter };
