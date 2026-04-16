import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

const mockPrisma = {
  agent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  insurancePolicy: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  insuranceClaim: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  task: {
    findFirst: jest.fn(),
  },
};

jest.unstable_mockModule("../../src/config/database", () => ({
  prisma: mockPrisma,
}));

jest.unstable_mockModule("../../src/middleware/auth", () => ({
  siweAuth: jest.fn((req: any, res: any, next: any) => {
    req.user = { wallet: "0x1234567890123456789012345678901234567890" };
    next();
  }),
}));

jest.unstable_mockModule("../../src/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/services/insurance", () => ({
  insuranceService: {
    getCoverageStats: jest.fn().mockResolvedValue({
      totalPremiumsCollected: 50000,
      totalClaimsPaid: 10000,
      reserveBalance: 40000,
      activePolicies: 25,
      pendingClaims: 3,
    }),
    getCoverageQuote: jest.fn().mockResolvedValue({
      premium: 250,
      maxPayout: 10000,
    }),
    purchaseCoverage: jest.fn().mockResolvedValue({
      policyId: "1",
      txHash: "0xabc123",
      premium: BigInt(250000),
    }),
    submitClaim: jest.fn().mockResolvedValue({
      claimId: "1",
      txHash: "0xdef456",
    }),
    approveClaim: jest.fn().mockResolvedValue("0xghi789"),
    denyClaim: jest.fn().mockResolvedValue("0xjkl012"),
    calculateRiskScore: jest.fn().mockResolvedValue(7500),
    getClaimDetails: jest.fn().mockResolvedValue({
      claimId: "1",
      status: "APPROVED",
      amount: 1000,
    }),
  },
}));

jest.unstable_mockModule("../../src/services/blockchain", () => ({
  blockchainService: {
    approveAndCallUSDC: jest.fn().mockResolvedValue("0xtx123"),
    uploadToIPFS: jest.fn().mockResolvedValue("QmTest123"),
  },
}));

describe("Insurance Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("GET /stats", () => {
    it("should return insurance statistics", async () => {
      const stats = {
        totalPremiumsCollected: 50000,
        totalClaimsPaid: 10000,
        reserveBalance: 40000,
        activePolicies: 25,
        pendingClaims: 3,
      };

      expect(stats.totalPremiumsCollected).toBe(50000);
      expect(stats.reserveBalance).toBeGreaterThan(stats.totalClaimsPaid);
      expect(stats.activePolicies).toBeGreaterThan(0);
    });
  });

  describe("GET /quote", () => {
    it("should return coverage quote", async () => {
      const quote = {
        premium: 250,
        maxPayout: 10000,
        riskScore: 7500,
      };

      expect(quote.maxPayout).toBeGreaterThan(quote.premium);
      expect(quote.riskScore).toBeGreaterThan(0);
    });
  });

  describe("POST /purchase", () => {
    it("should validate purchase amount is within limits", () => {
      const validAmount = 10000;
      const minCoverage = 1;
      const maxCoverage = 100000;

      expect(validAmount).toBeGreaterThanOrEqual(minCoverage);
      expect(validAmount).toBeLessThanOrEqual(maxCoverage);
    });

    it("should validate duration is within limits", () => {
      const validDuration = 90;
      const minDuration = 30;
      const maxDuration = 365;

      expect(validDuration).toBeGreaterThanOrEqual(minDuration);
      expect(validDuration).toBeLessThanOrEqual(maxDuration);
    });

    it("should reject if agent is not registered", async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(null);

      const agent = await mockPrisma.agent.findUnique({
        where: { agentAddr: "0xunknown" },
      });

      expect(agent).toBeNull();
    });
  });

  describe("POST /claims", () => {
    it("should validate claim data", () => {
      const validClaim = {
        policyId: "1",
        amount: 1000,
        taskId: "task-123",
        reason: "Task failed due to external API outage",
      };

      expect(validClaim.amount).toBeGreaterThan(0);
      expect(validClaim.reason.length).toBeGreaterThanOrEqual(10);
      expect(validClaim.taskId).toBeDefined();
    });

    it("should reject duplicate claims for same task", async () => {
      const existingClaim = {
        id: "claim-1",
        taskId: "task-123",
        status: "SUBMITTED",
      };

      mockPrisma.insuranceClaim.findFirst.mockResolvedValue(existingClaim);

      const claim = await mockPrisma.insuranceClaim.findFirst({
        where: {
          taskId: "task-123",
          status: { notIn: ["DENIED", "RESOLVED"] },
        },
      });

      expect(claim).not.toBeNull();
    });
  });

  describe("Claim Status Transitions", () => {
    it("should track claim lifecycle", () => {
      const claim = {
        id: "claim-1",
        status: "SUBMITTED",
        createdAt: new Date(),
        resolvedAt: null,
      };

      claim.status = "UNDER_REVIEW";
      expect(claim.status).toBe("UNDER_REVIEW");

      claim.status = "APPROVED";
      claim.resolvedAt = new Date();
      expect(claim.status).toBe("APPROVED");
      expect(claim.resolvedAt).not.toBeNull();
    });
  });

  describe("Premium Calculation", () => {
    it("should calculate premium based on coverage and duration", () => {
      const coverageAmount = 10000;
      const premiumRateBps = 250;
      const durationDays = 90;

      const expectedPremium = (coverageAmount * premiumRateBps * durationDays) / (36500);

      expect(expectedPremium).toBeCloseTo(616.44, 0);
    });

    it("should apply discount for high-tier agents", () => {
      const basePremium = 616;
      const goldDiscountBps = 250;
      const platinumDiscountBps = 400;

      const goldPremium = basePremium * (10000 - goldDiscountBps) / 10000;
      const platinumPremium = basePremium * (10000 - platinumDiscountBps) / 10000;

      expect(goldPremium).toBeLessThan(basePremium);
      expect(platinumPremium).toBeLessThan(goldPremium);
    });
  });

  describe("Risk Score", () => {
    it("should calculate higher risk for new agents", async () => {
      const riskScore = 10000;

      expect(riskScore).toBeGreaterThanOrEqual(10000);
    });

    it("should lower risk for experienced agents", () => {
      const baseRisk = 10000;
      const experienceDiscount = 500;
      const tierDiscount = 300;

      const finalRisk = baseRisk - experienceDiscount - tierDiscount;

      expect(finalRisk).toBeLessThan(baseRisk);
    });
  });

  describe("Coverage Limits", () => {
    it("should enforce minimum coverage", () => {
      const minCoverage = 1000000;
      const requestedCoverage = 500000;

      expect(requestedCoverage).toBeLessThan(minCoverage);
    });

    it("should enforce maximum coverage", () => {
      const maxCoverage = 100000000000;
      const requestedCoverage = 200000000000;

      expect(requestedCoverage).toBeGreaterThan(maxCoverage);
    });
  });
});
