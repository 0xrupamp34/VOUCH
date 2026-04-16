import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { logger } from "../../utils/logger";
import { complianceService, AIAppType, ComplianceStatus } from "../../services/compliance";
import { z } from "zod";

const router = Router();

router.get("/report", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const report = await complianceService.generateComplianceReport(agent.id);

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/agent/:agentId/report", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.agentId },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const report = await complianceService.generateComplianceReport(agent.id);

    res.json({
      success: true,
      report: {
        agentId: report.agentId,
        agentWallet: report.agentWallet,
        agentName: report.agentName,
        appType: report.appType,
        riskLevel: report.riskLevel,
        complianceStatus: report.complianceStatus,
        requirementsCount: report.requirements.length,
        metRequirementsCount: report.requirements.filter((r) => r.isMet).length,
        lastAudit: report.lastAudit,
        nextAuditDue: report.nextAuditDue,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/classify", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const appType = await complianceService.classifyAgentType(agent.id);

    res.json({
      success: true,
      agentId: agent.id,
      agentName: agent.displayName,
      appType,
      riskLevel: complianceService.getRiskLevelScore?.(appType) || 0,
    });
  } catch (error) {
    next(error);
  }
});

const requirementUpdateSchema = z.object({
  requirementId: z.string(),
  isMet: z.boolean(),
  evidenceUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
});

router.post("/requirements/update", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = requirementUpdateSchema.parse(req.body);

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    await complianceService.updateRequirementCompliance(
      agent.id,
      validated.requirementId,
      validated.isMet,
      validated.evidenceUrl || null,
      validated.notes || null,
      req.user!.wallet
    );

    res.json({
      success: true,
      message: "Requirement compliance updated",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    next(error);
  }
});

router.get("/requirements", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const report = await complianceService.generateComplianceReport(agent.id);

    res.json({
      success: true,
      requirements: report.requirements,
      summary: {
        total: report.requirements.length,
        met: report.requirements.filter((r) => r.isMet).length,
        pending: report.requirements.filter((r) => !r.isMet).length,
        byCategory: report.requirements.reduce((acc, r) => {
          acc[r.category] = acc[r.category] || { total: 0, met: 0 };
          acc[r.category].total++;
          if (r.isMet) acc[r.category].met++;
          return acc;
        }, {} as Record<string, { total: number; met: number }>),
      },
    });
  } catch (error) {
    next(error);
  }
});

const evidenceSchema = z.object({
  requirementId: z.string(),
  evidenceUrl: z.string().url(),
  description: z.string().min(10),
});

router.post("/evidence", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = evidenceSchema.parse(req.body);

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    await complianceService.submitEvidence(
      agent.id,
      validated.requirementId,
      validated.evidenceUrl,
      validated.description
    );

    res.json({
      success: true,
      message: "Evidence submitted successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    next(error);
  }
});

router.get("/evidence/:requirementId", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const evidence = await prisma.complianceEvidence.findMany({
      where: { agentId: agent.id, requirementId: req.params.requirementId },
      orderBy: { submittedAt: "desc" },
    });

    res.json({
      success: true,
      evidence: evidence.map((e) => ({
        id: e.id,
        evidenceUrl: e.evidenceUrl,
        description: e.description,
        submittedAt: e.submittedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

const auditRequestSchema = z.object({
  auditType: z.enum(["SELF_ASSESSMENT", "THIRD_PARTY", "REGULATORY", "INTERNAL"]),
  notes: z.string().nullable().optional(),
});

router.post("/audit/request", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = auditRequestSchema.parse(req.body);

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const auditId = await complianceService.requestAudit(
      agent.id,
      req.user!.wallet,
      validated.auditType,
      validated.notes || null
    );

    res.json({
      success: true,
      auditId,
      message: "Audit requested successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    next(error);
  }
});

router.get("/audits", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const audits = await prisma.complianceAudit.findMany({
      where: { agentId: agent.id },
      orderBy: { requestedAt: "desc" },
    });

    res.json({
      success: true,
      audits: audits.map((a) => ({
        id: a.id,
        auditType: a.auditType,
        status: a.status,
        notes: a.notes,
        requestedAt: a.requestedAt,
        completedAt: a.completedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/audit-trail", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const trail = await complianceService.generateAuditTrail(
      agent.id,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      auditTrail: trail,
      totalEntries: trail.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/gdpr-check", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: req.user!.wallet.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const gdprCheck = await complianceService.checkDataProcessingCompliance(agent.id);

    res.json({
      success: true,
      gdprCompliance: gdprCheck,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await complianceService.getComplianceDashboard();

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    next(error);
  }
});

export { router as complianceRouter };
