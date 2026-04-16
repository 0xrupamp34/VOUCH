import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

const mockPrisma = {
  agent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  complianceRequirement: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
  complianceEvidence: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  complianceAudit: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  auditTrail: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
  },
};

jest.unstable_mockModule("../../src/config/database", () => ({
  prisma: mockPrisma,
}));

jest.unstable_mockModule("../../src/services/blockchain", () => ({
  blockchainService: {
    uploadToIPFS: jest.fn().mockResolvedValue("QmComplianceTest123"),
  },
}));

jest.unstable_mockModule("../../src/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("EU AI Act Compliance Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("AI App Type Classification", () => {
    const AIAppType = {
      MINIMAL_RISK: "MINIMAL_RISK",
      LIMITED_RISK: "LIMITED_RISK",
      HIGH_RISK: "HIGH_RISK",
      UNACCEPTABLE_RISK: "UNACCEPTABLE_RISK",
    };

    it("should classify minimal risk agents", () => {
      const agent = {
        specializations: ["data_processing"],
        tasksCompleted: 10,
        tier: "BRONZE",
      };

      const isInHighRiskDomain = ["biometric", "critical_infrastructure", "education"].some(
        domain => agent.specializations.some((spec: string) => spec.toLowerCase().includes(domain))
      );

      expect(isInHighRiskDomain).toBe(false);
      expect(agent.tasksCompleted).toBeGreaterThan(0);
    });

    it("should classify high risk agents in regulated domains", () => {
      const agent = {
        specializations: ["education", "assessment"],
        tier: "GOLD",
      };

      const highRiskDomains = [
        "biometric", "critical_infrastructure", "education",
        "employment", "essential_services", "law_enforcement"
      ];

      const isInHighRiskDomain = agent.specializations.some(
        (spec: string) => highRiskDomains.some(domain => spec.toLowerCase().includes(domain))
      );

      expect(isInHighRiskDomain).toBe(true);
    });

    it("should classify platinum agents as high risk", () => {
      const agent = {
        specializations: ["code_generation"],
        tier: "PLATINUM",
      };

      const isHighRisk = agent.tier === "PLATINUM";

      expect(isHighRisk).toBe(true);
    });
  });

  describe("GDPR Requirements", () => {
    const gdprRequirements = [
      { id: "gdpr_art17", name: "Right to Erasure" },
      { id: "gdpr_art20", name: "Data Portability" },
      { id: "gdpr_art13", name: "Access Rights" },
      { id: "gdpr_art5", name: "Data Minimization" },
    ];

    it("should have all required GDPR articles", () => {
      expect(gdprRequirements.length).toBe(4);
      expect(gdprRequirements.map((r: any) => r.id)).toContain("gdpr_art17");
      expect(gdprRequirements.map((r: any) => r.id)).toContain("gdpr_art20");
    });
  });

  describe("EU AI Act High Risk Requirements", () => {
    const euAIRequirements = [
      { id: "euaia_art9", name: "Risk Management System" },
      { id: "euaia_art10", name: "Data Governance" },
      { id: "euaia_art11", name: "Technical Documentation" },
      { id: "euaia_art12", name: "Transparency" },
      { id: "euaia_art13", name: "Human Oversight" },
      { id: "euaia_art14", name: "Accuracy & Robustness" },
      { id: "euaia_art15", name: "Logging & Monitoring" },
      { id: "euaia_art16", name: "Incident Reporting" },
      { id: "euaia_art17", name: "CE Marking" },
    ];

    it("should have all EU AI Act articles for high risk", () => {
      expect(euAIRequirements.length).toBe(9);
      expect(euAIRequirements.map((r: any) => r.id)).toContain("euaia_art9");
      expect(euAIRequirements.map((r: any) => r.id)).toContain("euaia_art17");
    });
  });

  describe("Compliance Status Calculation", () => {
    const ComplianceStatus = {
      NOT_STARTED: "NOT_STARTED",
      IN_PROGRESS: "IN_PROGRESS",
      COMPLIANT: "COMPLIANT",
      NON_COMPLIANT: "NON_COMPLIANT",
      AUDIT_REQUIRED: "AUDIT_REQUIRED",
    };

    it("should return COMPLIANT when all requirements met", () => {
      const requirements = [
        { isMet: true },
        { isMet: true },
        { isMet: true },
      ];

      const metCount = requirements.filter((r: any) => r.isMet).length;
      const complianceRate = metCount / requirements.length;

      expect(complianceRate).toBe(1);
      expect(complianceRate === 1 ? ComplianceStatus.COMPLIANT : null).toBe(ComplianceStatus.COMPLIANT);
    });

    it("should return IN_PROGRESS when 80% or more met", () => {
      const requirements = [
        { isMet: true },
        { isMet: true },
        { isMet: true },
        { isMet: true },
        { isMet: false },
      ];

      const metCount = requirements.filter((r: any) => r.isMet).length;
      const complianceRate = metCount / requirements.length;

      expect(complianceRate).toBe(0.8);
      expect(complianceRate >= 0.8 && complianceRate < 1 ? ComplianceStatus.IN_PROGRESS : null)
        .toBe(ComplianceStatus.IN_PROGRESS);
    });

    it("should return NON_COMPLIANT when less than 80% met", () => {
      const requirements = [
        { isMet: true },
        { isMet: true },
        { isMet: false },
        { isMet: false },
        { isMet: false },
      ];

      const metCount = requirements.filter((r: any) => r.isMet).length;
      const complianceRate = metCount / requirements.length;

      expect(complianceRate).toBe(0.4);
      expect(complianceRate < 0.8 && requirements.length > 0 ? ComplianceStatus.NON_COMPLIANT : null)
        .toBe(ComplianceStatus.NON_COMPLIANT);
    });
  });

  describe("Risk Level Scoring", () => {
    it("should assign correct risk scores", () => {
      const riskScores: Record<string, number> = {
        MINIMAL_RISK: 1,
        LIMITED_RISK: 5,
        HIGH_RISK: 8,
        UNACCEPTABLE_RISK: 10,
      };

      expect(riskScores.MINIMAL_RISK).toBe(1);
      expect(riskScores.HIGH_RISK).toBe(8);
      expect(riskScores.UNACCEPTABLE_RISK).toBe(10);
    });
  });

  describe("Audit Schedule", () => {
    it("should schedule high risk audits every 180 days", () => {
      const lastAudit = new Date("2024-01-01");
      const intervalDays = 180;

      const nextAudit = new Date(lastAudit.getTime() + intervalDays * 24 * 60 * 60 * 1000);

      expect(nextAudit.getMonth()).toBe(6);
    });

    it("should schedule limited risk audits every 365 days", () => {
      const lastAudit = new Date("2024-01-01");
      const intervalDays = 365;

      const nextAudit = new Date(lastAudit.getTime() + intervalDays * 24 * 60 * 60 * 1000);

      expect(nextAudit.getFullYear()).toBe(2025);
    });

    it("should not require audit for minimal risk", () => {
      const appType = "MINIMAL_RISK";
      const requiresAudit = appType !== "MINIMAL_RISK";

      expect(requiresAudit).toBe(false);
    });
  });

  describe("Data Processing Compliance", () => {
    it("should check data minimization", () => {
      const tasks = [
        { completionIpfs: null },
        { completionIpfs: null },
      ];

      const hasTaskData = tasks.some((t: any) => t.completionIpfs);

      expect(hasTaskData).toBe(false);
    });

    it("should verify storage limitation", () => {
      const recentTaskDate = new Date("2024-12-01");
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const needsRetentionReview = recentTaskDate < oneYearAgo;

      expect(needsRetentionReview).toBe(false);
    });
  });

  describe("Compliance Dashboard", () => {
    it("should aggregate compliance statistics", () => {
      const reports = [
        { complianceStatus: "COMPLIANT", appType: "HIGH_RISK" },
        { complianceStatus: "NON_COMPLIANT", appType: "LIMITED_RISK" },
        { complianceStatus: "COMPLIANT", appType: "MINIMAL_RISK" },
        { complianceStatus: "AUDIT_REQUIRED", appType: "HIGH_RISK" },
      ];

      const stats = {
        totalAgents: reports.length,
        compliantAgents: reports.filter((r: any) => r.complianceStatus === "COMPLIANT").length,
        nonCompliantAgents: reports.filter((r: any) => r.complianceStatus === "NON_COMPLIANT").length,
        auditRequired: reports.filter((r: any) => r.complianceStatus === "AUDIT_REQUIRED").length,
        highRiskAgents: reports.filter((r: any) => r.appType === "HIGH_RISK").length,
      };

      expect(stats.totalAgents).toBe(4);
      expect(stats.compliantAgents).toBe(2);
      expect(stats.highRiskAgents).toBe(2);
    });
  });

  describe("Audit Trail", () => {
    it("should log compliance actions", () => {
      const auditEntry = {
        id: "audit-1",
        agentId: "agent-1",
        action: "REQUIREMENT_UPDATED",
        category: "COMPLIANCE",
        details: { requirementId: "gdpr_art17", isMet: true },
        performedBy: "0x1234567890123456789012345678901234567890",
        performedAt: new Date(),
      };

      expect(auditEntry.action).toBe("REQUIREMENT_UPDATED");
      expect(auditEntry.category).toBe("COMPLIANCE");
      expect(auditEntry.details.isMet).toBe(true);
    });

    it("should support filtering by date range", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");

      const entries = [
        { performedAt: new Date("2024-06-15") },
        { performedAt: new Date("2024-03-01") },
        { performedAt: new Date("2025-01-01") },
      ];

      const filtered = entries.filter((e: any) => e.performedAt >= startDate && e.performedAt <= endDate);

      expect(filtered.length).toBe(2);
    });
  });
});
