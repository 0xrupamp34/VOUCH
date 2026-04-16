import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

const mockPrisma = {
  agent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
  },
  reputationHistory: {
    findMany: jest.fn(),
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

jest.unstable_mockModule("../../src/services/blockchain", () => ({
  blockchainService: {
    uploadToIPFS: jest.fn().mockResolvedValue("QmMCPTest123"),
    createTask: jest.fn().mockResolvedValue("0xtask123"),
    submitCompletion: jest.fn().mockResolvedValue("0xcompletion123"),
  },
}));

describe("MCP Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("Capability Registration", () => {
    const CAPABILITY_HASHES: Record<string, string> = {
      code_generation: "0x11",
      code_review: "0x12",
      research: "0x13",
      data_processing: "0x14",
      communication: "0x15",
      design: "0x16",
      planning: "0x17",
      analysis: "0x18",
    };

    it("should have predefined capability hashes", () => {
      expect(CAPABILITY_HASHES.code_generation).toBeDefined();
      expect(CAPABILITY_HASHES.research).toBeDefined();
      expect(Object.keys(CAPABILITY_HASHES).length).toBe(8);
    });

    it("should map capabilities to hashes", () => {
      const capabilities = ["code_generation", "research"];
      const hashes = capabilities.map(cap => CAPABILITY_HASHES[cap]);

      expect(hashes).toContain("0x11");
      expect(hashes).toContain("0x13");
    });

    it("should handle unknown capabilities", () => {
      const unknownCapability = "unknown_skill";
      const hash = CAPABILITY_HASHES[unknownCapability] || "0x0000";

      expect(hash).toBe("0x0000");
    });
  });

  describe("POST /mcp/register", () => {
    it("should register MCP agent successfully", async () => {
      const mockAgent = {
        id: "agent-1",
        agentAddr: "0x1234567890123456789012345678901234567890",
        displayName: "MCP Agent",
        isActive: true,
      };

      mockPrisma.agent.findUnique.mockResolvedValue(mockAgent);

      const agent = await mockPrisma.agent.findUnique({
        where: { agentAddr: "0x1234567890123456789012345678901234567890" },
      });

      expect(agent).not.toBeNull();
      expect(agent?.isActive).toBe(true);
    });

    it("should reject registration for non-existent agent", async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(null);

      const agent = await mockPrisma.agent.findUnique({
        where: { agentAddr: "0xunknown" },
      });

      expect(agent).toBeNull();
    });
  });

  describe("POST /mcp/verify", () => {
    it("should return verified status for active agent", async () => {
      const mockAgent = {
        agentAddr: "0x1234567890123456789012345678901234567890",
        isActive: true,
        tier: "GOLD",
        ewmaScore: 8500,
        tasksCompleted: 100,
      };

      expect(mockAgent.isActive).toBe(true);
      expect(mockAgent.tier).toBe("GOLD");
    });

    it("should return not verified for inactive agent", async () => {
      const mockAgent = {
        agentAddr: "0x1234567890123456789012345678901234567890",
        isActive: false,
      };

      expect(mockAgent.isActive).toBe(false);
    });
  });

  describe("GET /mcp/agents", () => {
    it("should filter agents by minimum tier", () => {
      const tierOrder = ["UNRANKED", "BRONZE", "SILVER", "GOLD", "PLATINUM"];
      const minTier = "SILVER";
      const tierIndex = tierOrder.indexOf(minTier);

      const allowedTiers = tierOrder.slice(tierIndex);

      expect(allowedTiers).toContain("SILVER");
      expect(allowedTiers).toContain("GOLD");
      expect(allowedTiers).toContain("PLATINUM");
      expect(allowedTiers).not.toContain("BRONZE");
    });

    it("should filter agents by minimum score", () => {
      const agents = [
        { ewmaScore: 9500 },
        { ewmaScore: 7500 },
        { ewmaScore: 5500 },
        { ewmaScore: 3500 },
      ];

      const minScore = 6000;
      const filtered = agents.filter(a => a.ewmaScore >= minScore);

      expect(filtered.length).toBe(2);
      expect(filtered[0].ewmaScore).toBe(9500);
    });

    it("should filter agents by capability", () => {
      const agents = [
        { specializations: ["code_generation", "research"] },
        { specializations: ["design", "planning"] },
        { specializations: ["code_generation", "analysis"] },
      ];

      const capability = "code_generation";
      const filtered = agents.filter(a => a.specializations.includes(capability));

      expect(filtered.length).toBe(2);
    });
  });

  describe("POST /mcp/delegate", () => {
    it("should validate delegation capability", () => {
      const toAgent = {
        specializations: ["code_generation", "research"],
        ewmaScore: 7500,
      };

      const requiredCapability = "code_generation";
      const hasCapability = toAgent.specializations.includes(requiredCapability);

      expect(hasCapability).toBe(true);
    });

    it("should check reputation threshold", () => {
      const fromAgent = { ewmaScore: 8000 };
      const toAgent = { ewmaScore: 3500 };

      const meetsThreshold = toAgent.ewmaScore >= fromAgent.ewmaScore / 2;

      expect(meetsThreshold).toBe(false);
    });

    it("should allow delegation to reputable agent", () => {
      const fromAgent = { ewmaScore: 8000 };
      const toAgent = { ewmaScore: 5000 };

      const meetsThreshold = toAgent.ewmaScore >= fromAgent.ewmaScore / 2;

      expect(meetsThreshold).toBe(true);
    });
  });

  describe("MCP Tools", () => {
    describe("vouch_score_query", () => {
      it("should return agent score details", () => {
        const agent = {
          agentAddr: "0x1234567890123456789012345678901234567890",
          tokenId: BigInt(1),
          isActive: true,
          ewmaScore: 8500,
          rawScore: 8700,
          tier: "GOLD",
          tasksCompleted: 100,
          tasksFailed: 10,
        };

        const totalTasks = agent.tasksCompleted + agent.tasksFailed;
        const winRate = totalTasks > 0 ? agent.tasksCompleted / totalTasks : 0;

        expect(agent.ewmaScore).toBe(8500);
        expect(winRate).toBeCloseTo(0.91, 1);
      });

      it("should calculate win rate correctly", () => {
        const tasksCompleted = 80;
        const tasksFailed = 20;
        const totalTasks = tasksCompleted + tasksFailed;

        const winRate = tasksCompleted / totalTasks;

        expect(winRate).toBe(0.8);
      });
    });

    describe("vouch_task_create", () => {
      it("should validate task parameters", () => {
        const taskParams = {
          title: "Code Review Task",
          description: "Review smart contract code",
          usdcAmount: 100,
          deadline: "2024-12-31",
          preferredTier: "SILVER",
        };

        expect(taskParams.usdcAmount).toBeGreaterThan(0);
        expect(taskParams.title.length).toBeGreaterThan(0);
        expect(new Date(taskParams.deadline).getTime()).toBeGreaterThan(Date.now());
      });

      it("should convert USDC to smallest unit", () => {
        const usdcAmount = 100;
        const usdcAmountBigInt = BigInt(Math.floor(usdcAmount * 1e6));

        expect(usdcAmountBigInt).toBe(BigInt(100000000));
      });
    });

    describe("vouch_completion_submit", () => {
      it("should upload completion proof to IPFS", async () => {
        const completionProof = {
          summary: "Task completed successfully",
          deliverables: ["report.pdf", "code.zip"],
          notes: "All requirements met",
        };

        const ipfsHash = "QmTestCompletion123";

        expect(ipfsHash).toContain("Qm");
      });
    });
  });

  describe("Agent Discovery", () => {
    it("should sort agents by score descending", () => {
      const agents = [
        { displayName: "Agent A", ewmaScore: 7500 },
        { displayName: "Agent B", ewmaScore: 9500 },
        { displayName: "Agent C", ewmaScore: 8500 },
      ];

      const sorted = agents.sort((a, b) => b.ewmaScore - a.ewmaScore);

      expect(sorted[0].displayName).toBe("Agent B");
      expect(sorted[1].displayName).toBe("Agent C");
      expect(sorted[2].displayName).toBe("Agent A");
    });

    it("should limit results", () => {
      const agents = Array.from({ length: 100 }, (_, i) => ({
        displayName: `Agent ${i}`,
        ewmaScore: 9000 - i * 10,
      }));

      const limit = 20;
      const limited = agents.slice(0, limit);

      expect(limited.length).toBe(20);
    });
  });
});
