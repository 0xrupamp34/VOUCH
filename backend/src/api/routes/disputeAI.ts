import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { logger } from "../../utils/logger";
import { aiDisputeAssistant } from "../../services/aiDisputeAssistant";
import { z } from "zod";

const router = Router();

router.post("/disputes/:disputeId/analyze", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { disputeId } = req.params;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    const analysisResult = await aiDisputeAssistant.analyzeDispute(disputeId);

    logger.info(`AI analysis completed for dispute: ${disputeId}`, {
      recommendedOutcome: analysisResult.recommendedOutcome.type,
      confidence: analysisResult.recommendedOutcome.confidence,
    });

    res.json({
      success: true,
      analysis: analysisResult,
      ipfsHash: analysisResult.disputeId ? "recorded" : null,
    });
  } catch (error) {
    logger.error("AI analysis failed", { error, disputeId: req.params.disputeId });
    next(error);
  }
});

router.get("/disputes/:disputeId/analysis", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { disputeId } = req.params;

    const analysis = await aiDisputeAssistant.getAnalysis(disputeId);

    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/disputes/:disputeId/classify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { disputeId } = req.params;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { task: true },
    });

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    const description = dispute.reason;
    const requirements = dispute.task?.requirementsIpfs || "";
    const deliverables = dispute.task?.completionIpfs || "";

    const evidence = await aiDisputeAssistant.gatherEvidence(dispute);

    const posterStrength = 50;
    const agentStrength = 50;

    res.json({
      success: true,
      classification: {
        category: dispute.reason.includes("quality") ? "QUALITY" : 
                  dispute.reason.includes("fraud") ? "FRAUD" :
                  dispute.reason.includes("deadline") ? "TIMING" :
                  dispute.reason.includes("communication") ? "COMMUNICATION" : "COMPLETION",
        confidence: 70,
        posterStrengthScore: posterStrength,
        agentStrengthScore: agentStrength,
      },
      evidence: {
        posterCount: evidence.poster.length,
        agentCount: evidence.agent.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/disputes/:disputeId/evidence", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { disputeId } = req.params;
    const { evidenceHash, description, evidenceType } = req.body;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    const evidence = await prisma.disputeEvidence.create({
      data: {
        disputeId,
        evidenceHash,
        description,
        evidenceType,
        submittedBy: req.user!.wallet,
        ipfsHash: evidenceHash,
      },
    });

    logger.info(`Evidence submitted for dispute: ${disputeId}`, { evidenceType });

    res.json({
      success: true,
      evidence: {
        id: evidence.id,
        evidenceHash: evidence.evidenceHash,
        description: evidence.description,
        evidenceType: evidence.evidenceType,
        submittedAt: evidence.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/disputes/:disputeId/evidence", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { disputeId } = req.params;

    const evidence = await prisma.disputeEvidence.findMany({
      where: { disputeId },
      orderBy: { submittedAt: "desc" },
    });

    res.json({
      success: true,
      evidence: evidence.map((e) => ({
        id: e.id,
        evidenceHash: e.evidenceHash,
        description: e.description,
        evidenceType: e.evidenceType,
        submittedBy: e.submittedBy,
        ipfsHash: e.ipfsHash,
        submittedAt: e.submittedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await aiDisputeAssistant.getDisputeStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/disputes/:disputeId/validate", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { disputeId } = req.params;

    const analysis = await prisma.disputeAnalysis.findFirst({
      where: { disputeId },
      orderBy: { analyzedAt: "desc" },
    });

    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const isValid = analysis.status === "COMPLETED" && analysis.confidence >= 60;

    res.json({
      success: true,
      validation: {
        isValid,
        status: analysis.status,
        confidence: analysis.confidence,
        message: isValid
          ? "Analysis meets quality threshold"
          : `Analysis confidence (${analysis.confidence}) below threshold (60)`,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/similar/:disputeId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { disputeId } = req.params;
    const { limit = 10 } = req.query;

    const currentAnalysis = await prisma.disputeAnalysis.findFirst({
      where: { disputeId },
      orderBy: { analyzedAt: "desc" },
    });

    if (!currentAnalysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const similarDisputes = await prisma.disputeAnalysis.findMany({
      where: {
        id: { not: currentAnalysis.id },
        category: currentAnalysis.category,
        status: "COMPLETED",
      },
      take: Number(limit),
      orderBy: { confidence: "desc" },
    });

    const disputes = await Promise.all(
      similarDisputes.map(async (analysis) => {
        const dispute = await prisma.dispute.findFirst({
          where: { id: analysis.disputeId },
        });
        return {
          disputeId: analysis.disputeId,
          category: analysis.category,
          recommendedOutcome: analysis.recommendedOutcome,
          confidence: analysis.confidence,
          similarity: Math.min(95, 50 + analysis.confidence / 2),
          resolvedAt: dispute?.resolvedAt,
        };
      })
    );

    res.json({
      success: true,
      similarDisputes: disputes,
    });
  } catch (error) {
    next(error);
  }
});

export { router as disputeAIRouter };
