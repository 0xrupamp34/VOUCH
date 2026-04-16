import { prisma } from "../config/database";
import { blockchainService } from "./blockchain";
import { logger } from "../utils/logger";

enum AIAppType {
  MINIMAL_RISK = "MINIMAL_RISK",
  LIMITED_RISK = "LIMITED_RISK",
  HIGH_RISK = "HIGH_RISK",
  UNACCEPTABLE_RISK = "UNACCEPTABLE_RISK",
}

enum ComplianceStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLIANT = "COMPLIANT",
  NON_COMPLIANT = "NON_COMPLIANT",
  AUDIT_REQUIRED = "AUDIT_REQUIRED",
}

interface ComplianceReport {
  agentId: string;
  agentWallet: string;
  agentName: string;
  appType: AIAppType;
  riskLevel: number;
  complianceStatus: ComplianceStatus;
  requirements: ComplianceRequirement[];
  lastAudit: Date | null;
  nextAuditDue: Date | null;
  documentationUrl: string | null;
}

interface ComplianceRequirement {
  requirementId: string;
  requirementName: string;
  description: string;
  category: string;
  isMet: boolean;
  evidenceUrl: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  notes: string | null;
}

interface AuditTrailEntry {
  id: string;
  agentId: string;
  action: string;
  category: string;
  details: Record<string, any>;
  performedBy: string;
  performedAt: Date;
  ipfsHash: string | null;
}

class ComplianceService {
  private readonly GDPR_REQUIREMENTS = [
    { id: "gdpr_art17", name: "Right to Erasure", description: "Ability to delete personal data upon request" },
    { id: "gdpr_art20", name: "Data Portability", description: "Provide data in machine-readable format" },
    { id: "gdpr_art13", name: "Access Rights", description: "Allow users to access their data" },
    { id: "gdpr_art5", name: "Data Minimization", description: "Only collect necessary data" },
  ];

  private readonly EU_AI_HIGH_RISK_REQUIREMENTS = [
    { id: "euaia_art9", name: "Risk Management System", description: "Documented risk management processes" },
    { id: "euaia_art10", name: "Data Governance", description: "Data governance practices for training data" },
    { id: "euaia_art11", name: "Technical Documentation", description: "Complete technical documentation" },
    { id: "euaia_art12", name: "Transparency", description: "User-facing information about AI systems" },
    { id: "euaia_art13", name: "Human Oversight", description: "Human oversight mechanisms" },
    { id: "euaia_art14", name: "Accuracy & Robustness", description: "Accuracy metrics and robustness testing" },
    { id: "euaia_art15", name: "Logging & Monitoring", description: "Event logging and performance monitoring" },
    { id: "euaia_art16", name: "Incident Reporting", description: "Incident reporting mechanisms" },
    { id: "euaia_art17", name: "CE Marking", description: "Conformity assessment and marking" },
  ];

  async classifyAgentType(agentId: string): Promise<AIAppType> {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { tasks: { take: 10 } },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    const riskIndicators = this.assessRiskIndicators(agent);

    if (riskIndicators.unacceptableRisk) {
      return AIAppType.UNACCEPTABLE_RISK;
    }

    if (riskIndicators.highRisk) {
      return AIAppType.HIGH_RISK;
    }

    if (riskIndicators.limitedRisk) {
      return AIAppType.LIMITED_RISK;
    }

    return AIAppType.MINIMAL_RISK;
  }

  private assessRiskIndicators(agent: any): {
    unacceptableRisk: boolean;
    highRisk: boolean;
    limitedRisk: boolean;
  } {
    const highRiskDomains = [
      "biometric", "critical_infrastructure", "education", "employment",
      "essential_services", "law_enforcement", "migration", "justice", "democracy"
    ];

    const agentSpecializations = agent.specializations || [];

    const isInHighRiskDomain = agentSpecializations.some(
      (spec: string) => highRiskDomains.some(domain => spec.toLowerCase().includes(domain))
    );

    return {
      unacceptableRisk: false,
      highRisk: isInHighRiskDomain || agent.tier === "PLATINUM",
      limitedRisk: agent.tasksCompleted > 0 && !isInHighRiskDomain,
    };
  }

  async generateComplianceReport(agentId: string): Promise<ComplianceReport> {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    const appType = await this.classifyAgentType(agentId);
    const requirements = await this.getRequirementsForAppType(appType, agentId);
    const complianceStatus = this.calculateComplianceStatus(requirements);

    const lastAudit = await this.getLastAudit(agentId);
    const nextAuditDue = this.calculateNextAuditDate(lastAudit, appType);

    const documentationUrl = await this.uploadComplianceDocumentation(agentId, requirements);

    return {
      agentId,
      agentWallet: agent.agentAddr,
      agentName: agent.displayName,
      appType,
      riskLevel: this.getRiskLevelScore(appType),
      complianceStatus,
      requirements,
      lastAudit,
      nextAuditDue,
      documentationUrl,
    };
  }

  private async getRequirementsForAppType(
    appType: AIAppType,
    agentId: string
  ): Promise<ComplianceRequirement[]> {
    const requirements: ComplianceRequirement[] = [];

    for (const req of this.GDPR_REQUIREMENTS) {
      const existing = await prisma.complianceRequirement.findFirst({
        where: { agentId, requirementId: req.id },
      });

      requirements.push({
        requirementId: req.id,
        requirementName: req.name,
        description: req.description,
        category: "GDPR",
        isMet: existing?.isMet || false,
        evidenceUrl: existing?.evidenceUrl || null,
        verifiedAt: existing?.verifiedAt || null,
        verifiedBy: existing?.verifiedBy || null,
        notes: existing?.notes || null,
      });
    }

    if (appType === AIAppType.HIGH_RISK || appType === AIAppType.LIMITED_RISK) {
      for (const req of this.EU_AI_HIGH_RISK_REQUIREMENTS) {
        const existing = await prisma.complianceRequirement.findFirst({
          where: { agentId, requirementId: req.id },
        });

        requirements.push({
          requirementId: req.id,
          requirementName: req.name,
          description: req.description,
          category: "EU_AI_ACT",
          isMet: existing?.isMet || false,
          evidenceUrl: existing?.evidenceUrl || null,
          verifiedAt: existing?.verifiedAt || null,
          verifiedBy: existing?.verifiedBy || null,
          notes: existing?.notes || null,
        });
      }
    }

    return requirements;
  }

  private calculateComplianceStatus(requirements: ComplianceRequirement[]): ComplianceStatus {
    const totalRequirements = requirements.length;
    const metRequirements = requirements.filter((r) => r.isMet).length;
    const complianceRate = totalRequirements > 0 ? metRequirements / totalRequirements : 0;

    if (complianceRate === 1) {
      return ComplianceStatus.COMPLIANT;
    }

    if (complianceRate >= 0.8) {
      return ComplianceStatus.IN_PROGRESS;
    }

    if (totalRequirements === 0) {
      return ComplianceStatus.NOT_STARTED;
    }

    return ComplianceStatus.NON_COMPLIANT;
  }

  private getRiskLevelScore(appType: AIAppType): number {
    const scores: Record<AIAppType, number> = {
      [AIAppType.MINIMAL_RISK]: 1,
      [AIAppType.LIMITED_RISK]: 5,
      [AIAppType.HIGH_RISK]: 8,
      [AIAppType.UNACCEPTABLE_RISK]: 10,
    };
    return scores[appType];
  }

  private async getLastAudit(agentId: string): Promise<Date | null> {
    const lastAudit = await prisma.complianceAudit.findFirst({
      where: { agentId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    });

    return lastAudit?.completedAt || null;
  }

  private calculateNextAuditDate(lastAudit: Date | null, appType: AIAppType): Date | null {
    if (appType === AIAppType.MINIMAL_RISK) {
      return null;
    }

    const baseIntervalDays = appType === AIAppType.HIGH_RISK ? 180 : 365;
    const lastDate = lastAudit || new Date();
    
    return new Date(lastDate.getTime() + baseIntervalDays * 24 * 60 * 60 * 1000);
  }

  async updateRequirementCompliance(
    agentId: string,
    requirementId: string,
    isMet: boolean,
    evidenceUrl: string | null,
    notes: string | null,
    verifiedBy: string
  ): Promise<void> {
    await prisma.complianceRequirement.upsert({
      where: {
        agentId_requirementId: { agentId, requirementId },
      },
      create: {
        agentId,
        requirementId,
        requirementName: requirementId,
        description: "",
        category: "EU_AI_ACT",
        isMet,
        evidenceUrl,
        notes,
        verifiedBy,
        verifiedAt: new Date(),
      },
      update: {
        isMet,
        evidenceUrl,
        notes,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });

    await this.logAuditEntry(agentId, "REQUIREMENT_UPDATED", "COMPLIANCE", {
      requirementId,
      isMet,
      evidenceUrl,
    }, verifiedBy);

    logger.info(`Compliance requirement updated: ${requirementId}`, { agentId, isMet });
  }

  async requestAudit(
    agentId: string,
    requestedBy: string,
    auditType: string,
    notes: string | null
  ): Promise<string> {
    const audit = await prisma.complianceAudit.create({
      data: {
        agentId,
        auditType,
        status: "REQUESTED",
        requestedBy,
        notes,
        requestedAt: new Date(),
      },
    });

    await this.logAuditEntry(agentId, "AUDIT_REQUESTED", "COMPLIANCE", {
      auditId: audit.id,
      auditType,
      notes,
    }, requestedBy);

    return audit.id;
  }

  async submitEvidence(
    agentId: string,
    requirementId: string,
    evidenceUrl: string,
    description: string
  ): Promise<void> {
    await prisma.complianceEvidence.create({
      data: {
        agentId,
        requirementId,
        evidenceUrl,
        description,
        submittedAt: new Date(),
      },
    });

    await this.logAuditEntry(agentId, "EVIDENCE_SUBMITTED", "COMPLIANCE", {
      requirementId,
      evidenceUrl,
      description,
    }, agentId);

    logger.info(`Compliance evidence submitted for: ${requirementId}`, { agentId });
  }

  async generateAuditTrail(agentId: string, startDate?: Date, endDate?: Date): Promise<AuditTrailEntry[]> {
    const where: any = { agentId };
    
    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) where.performedAt.gte = startDate;
      if (endDate) where.performedAt.lte = endDate;
    }

    const entries = await prisma.auditTrail.findMany({
      where,
      orderBy: { performedAt: "desc" },
    });

    const trailEntries: AuditTrailEntry[] = [];

    for (const entry of entries) {
      const ipfsHash = await this.persistAuditEntry(entry);

      trailEntries.push({
        id: entry.id,
        agentId: entry.agentId,
        action: entry.action,
        category: entry.category,
        details: entry.details as Record<string, any>,
        performedBy: entry.performedBy,
        performedAt: entry.performedAt,
        ipfsHash,
      });
    }

    return trailEntries;
  }

  private async persistAuditEntry(entry: any): Promise<string | null> {
    try {
      const ipfsHash = await blockchainService.uploadToIPFS({
        ...entry.details,
        agentId: entry.agentId,
        action: entry.action,
        category: entry.category,
        performedBy: entry.performedBy,
        performedAt: entry.performedAt.toISOString(),
      });
      return ipfsHash;
    } catch (error) {
      logger.error("Failed to persist audit entry to IPFS", { error });
      return null;
    }
  }

  private async logAuditEntry(
    agentId: string,
    action: string,
    category: string,
    details: Record<string, any>,
    performedBy: string
  ): Promise<void> {
    await prisma.auditTrail.create({
      data: {
        agentId,
        action,
        category,
        details,
        performedBy,
        performedAt: new Date(),
      },
    });
  }

  private async uploadComplianceDocumentation(
    agentId: string,
    requirements: ComplianceRequirement[]
  ): Promise<string | null> {
    try {
      const documentation = {
        generatedAt: new Date().toISOString(),
        agentId,
        requirements,
        totalRequirements: requirements.length,
        metRequirements: requirements.filter((r) => r.isMet).length,
      };

      const ipfsHash = await blockchainService.uploadToIPFS(documentation);
      return ipfsHash;
    } catch (error) {
      logger.error("Failed to upload compliance documentation", { error });
      return null;
    }
  }

  async checkDataProcessingCompliance(agentId: string): Promise<{
    dataMinimization: boolean;
    purposeLimitation: boolean;
    storageLimitation: boolean;
    recommendations: string[];
  }> {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    const recommendations: string[] = [];
    let dataMinimization = true;
    let purposeLimitation = true;
    let storageLimitation = true;

    const tasks = await prisma.task.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const hasTaskData = tasks.some((t) => t.completionIpfs);

    if (!hasTaskData) {
      dataMinimization = false;
      recommendations.push("Agent should document data processing activities");
    }

    if (agent.tasksCompleted < 10) {
      purposeLimitation = false;
      recommendations.push("More task history needed to verify purpose limitation");
    }

    const recentTaskDate = tasks[0]?.createdAt;
    if (recentTaskDate && Date.now() - recentTaskDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
      storageLimitation = false;
      recommendations.push("Consider data retention review");
    }

    return {
      dataMinimization,
      purposeLimitation,
      storageLimitation,
      recommendations,
    };
  }

  async getComplianceDashboard(): Promise<{
    totalAgents: number;
    compliantAgents: number;
    nonCompliantAgents: number;
    auditRequired: number;
    highRiskAgents: number;
  }> {
    const [agents, reports] = await Promise.all([
      prisma.agent.findMany({ where: { isActive: true } }),
      Promise.all([
        ...(await prisma.agent.findMany({ where: { isActive: true } }))
          .map((a) => this.generateComplianceReport(a.id).catch(() => null)),
      ]),
    ]);

    const validReports = reports.filter((r): r is ComplianceReport => r !== null);

    return {
      totalAgents: agents.length,
      compliantAgents: validReports.filter((r) => r.complianceStatus === ComplianceStatus.COMPLIANT).length,
      nonCompliantAgents: validReports.filter((r) => r.complianceStatus === ComplianceStatus.NON_COMPLIANT).length,
      auditRequired: validReports.filter((r) => r.complianceStatus === ComplianceStatus.AUDIT_REQUIRED).length,
      highRiskAgents: validReports.filter((r) => r.appType === AIAppType.HIGH_RISK).length,
    };
  }
}

export const complianceService = new ComplianceService();
export { AIAppType, ComplianceStatus };
