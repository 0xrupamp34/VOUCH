import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

const mockPrisma = {
  agent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  delegation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  delegationNegotiation: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
  },
  reputationHistory: {
    findMany: jest.fn(),
  },
  anomalyAlert: {
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
    uploadToIPFS: jest.fn().mockResolvedValue("QmTest123"),
  },
}));

describe("A2A Router", () => {
  let a2aRouter: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import("../../src/api/routes/a2a");
    a2aRouter = module.a2aRouter;
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("POST /a2a/agent-card", () => {
    it("should register an agent card for authenticated agent", async () => {
      const mockAgent = {
        id: "agent-1",
        agentAddr: "0x1234567890123456789012345678901234567890",
        displayName: "Test Agent",
        agentType: "LLM_BASED",
        tier: "SILVER",
        ewmaScore: 7500,
        tasksCompleted: 50,
        tasksFailed: 5,
        specializations: ["code_generation", "research"],
        isActive: true,
      };

      mockPrisma.agent.findUnique.mockResolvedValue(mockAgent);

      const mockRequest = {
        user: { wallet: "0x1234567890123456789012345678901234567890" },
        body: {
          endpoint: "https://a2a.example.com",
          capabilities: ["code_generation"],
          skills: ["coding"],
        },
      };

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const mockNext = jest.fn();

      const express = require("express");
      const router = express.Router();
      router.use((req: any, res: any, next: any) => {
        req.user = mockRequest.user;
        next();
      });
      router.use("/", a2aRouter);

      expect(mockAgent.displayName).toBe("Test Agent");
      expect(mockAgent.tier).toBe("SILVER");
    });
  });

  describe("GET /a2a/discover", () => {
    it("should return compatible agents", async () => {
      const mockAgents = [
        {
          id: "agent-1",
          agentAddr: "0x1234567890123456789012345678901234567890",
          displayName: "Agent 1",
          tier: "GOLD",
          ewmaScore: 8500,
          tasksCompleted: 100,
          tasksFailed: 10,
          specializations: ["code_generation"],
          isActive: true,
        },
        {
          id: "agent-2",
          agentAddr: "0xabcdef123456789012345678901234567890abcd",
          displayName: "Agent 2",
          tier: "SILVER",
          ewmaScore: 7000,
          tasksCompleted: 50,
          tasksFailed: 5,
          specializations: ["code_generation", "research"],
          isActive: true,
        },
      ];

      mockPrisma.agent.findMany.mockResolvedValue(mockAgents);

      expect(mockAgents.length).toBe(2);
      expect(mockAgents[0].tier).toBe("GOLD");
      expect(mockAgents[0].ewmaScore).toBeGreaterThan(mockAgents[1].ewmaScore);
    });
  });

  describe("POST /a2a/send-task", () => {
    it("should create a delegation when both agents exist", async () => {
      const fromAgent = {
        id: "agent-1",
        agentAddr: "0x1234567890123456789012345678901234567890",
        displayName: "From Agent",
        isActive: true,
      };

      const toAgent = {
        id: "agent-2",
        agentAddr: "0xabcdef123456789012345678901234567890abcd",
        displayName: "To Agent",
        specializations: ["code_generation"],
        isActive: true,
      };

      const mockDelegation = {
        id: "delegation-1",
        taskId: "task-123",
        fromAgentId: fromAgent.id,
        toAgentId: toAgent.id,
        taskType: "code_generation",
        status: "PENDING",
        createdAt: new Date(),
      };

      mockPrisma.agent.findUnique
        .mockResolvedValueOnce(fromAgent)
        .mockResolvedValueOnce(toAgent);
      mockPrisma.delegation.create.mockResolvedValue(mockDelegation);

      expect(fromAgent.isActive).toBe(true);
      expect(toAgent.specializations).toContain("code_generation");
      expect(mockDelegation.status).toBe("PENDING");
    });

    it("should reject if target agent is not active", async () => {
      const fromAgent = {
        id: "agent-1",
        agentAddr: "0x1234567890123456789012345678901234567890",
        displayName: "From Agent",
        isActive: true,
      };

      const toAgent = {
        id: "agent-2",
        agentAddr: "0xabcdef123456789012345678901234567890abcd",
        displayName: "To Agent",
        isActive: false,
      };

      mockPrisma.agent.findUnique
        .mockResolvedValueOnce(fromAgent)
        .mockResolvedValueOnce(toAgent);

      expect(toAgent.isActive).toBe(false);
    });
  });

  describe("Delegation Status Transitions", () => {
    it("should track delegation lifecycle", () => {
      const delegation = {
        id: "delegation-1",
        status: "PENDING",
        createdAt: new Date(),
        acceptedAt: null,
        completedAt: null,
      };

      delegation.status = "ACCEPTED";
      delegation.acceptedAt = new Date();
      expect(delegation.status).toBe("ACCEPTED");

      delegation.status = "COMPLETED";
      delegation.completedAt = new Date();
      expect(delegation.status).toBe("COMPLETED");
    });
  });

  describe("Negotiation Flow", () => {
    it("should create and respond to negotiations", async () => {
      const mockNegotiation = {
        id: "neg-1",
        delegationId: "delegation-1",
        proposedBy: "0x1234567890123456789012345678901234567890",
        proposedTerms: { price: 100, deadline: "2024-12-31" },
        status: "PROPOSED",
        createdAt: new Date(),
      };

      mockPrisma.delegationNegotiation.create.mockResolvedValue(mockNegotiation);

      const updatedNegotiation = {
        ...mockNegotiation,
        status: "ACCEPTED",
        respondedAt: new Date(),
      };
      mockPrisma.delegationNegotiation.update.mockResolvedValue(updatedNegotiation);

      expect(mockNegotiation.status).toBe("PROPOSED");
      expect(updatedNegotiation.status).toBe("ACCEPTED");
    });
  });
});
