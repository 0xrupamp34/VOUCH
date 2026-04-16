import { prisma } from "../config/database";
import { blockchainService } from "./blockchain";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

enum TierLevel {
  FREE = "FREE",
  STARTER = "STARTER",
  PROFESSIONAL = "PROFESSIONAL",
  ENTERPRISE = "ENTERPRISE",
  UNLIMITED = "UNLIMITED",
}

interface TierConfig {
  name: string;
  monthlyRateUsdc: number;
  requestsPerMinute: number;
  requestsPerDay: number;
  batchSizeLimit: number;
  hasSla: boolean;
  slaUptimeBps: number;
  maxLatencyMs: number;
  hasDedicatedSupport: boolean;
  supportResponseHours: number;
  hasCustomWebhooks: boolean;
  hasAdvancedAnalytics: boolean;
  hasPriorityProcessing: boolean;
}

const TIER_CONFIGS: Record<string, TierConfig> = {
  FREE: {
    name: "Free",
    monthlyRateUsdc: 0,
    requestsPerMinute: 10,
    requestsPerDay: 1000,
    batchSizeLimit: 5,
    hasSla: false,
    slaUptimeBps: 0,
    maxLatencyMs: 0,
    hasDedicatedSupport: false,
    supportResponseHours: 0,
    hasCustomWebhooks: false,
    hasAdvancedAnalytics: false,
    hasPriorityProcessing: false,
  },
  STARTER: {
    name: "Starter",
    monthlyRateUsdc: 99,
    requestsPerMinute: 60,
    requestsPerDay: 10000,
    batchSizeLimit: 25,
    hasSla: true,
    slaUptimeBps: 9950,
    maxLatencyMs: 500,
    hasDedicatedSupport: false,
    supportResponseHours: 48,
    hasCustomWebhooks: false,
    hasAdvancedAnalytics: false,
    hasPriorityProcessing: false,
  },
  PROFESSIONAL: {
    name: "Professional",
    monthlyRateUsdc: 499,
    requestsPerMinute: 300,
    requestsPerDay: 100000,
    batchSizeLimit: 100,
    hasSla: true,
    slaUptimeBps: 9990,
    maxLatencyMs: 300,
    hasDedicatedSupport: true,
    supportResponseHours: 24,
    hasCustomWebhooks: true,
    hasAdvancedAnalytics: true,
    hasPriorityProcessing: false,
  },
  ENTERPRISE: {
    name: "Enterprise",
    monthlyRateUsdc: 1999,
    requestsPerMinute: 1000,
    requestsPerDay: 1000000,
    batchSizeLimit: 500,
    hasSla: true,
    slaUptimeBps: 9995,
    maxLatencyMs: 200,
    hasDedicatedSupport: true,
    supportResponseHours: 4,
    hasCustomWebhooks: true,
    hasAdvancedAnalytics: true,
    hasPriorityProcessing: true,
  },
  UNLIMITED: {
    name: "Unlimited",
    monthlyRateUsdc: 9999,
    requestsPerMinute: 10000,
    requestsPerDay: Number.MAX_SAFE_INTEGER,
    batchSizeLimit: 1000,
    hasSla: true,
    slaUptimeBps: 9999,
    maxLatencyMs: 100,
    hasDedicatedSupport: true,
    supportResponseHours: 1,
    hasCustomWebhooks: true,
    hasAdvancedAnalytics: true,
    hasPriorityProcessing: true,
  },
};

interface EnterpriseClient {
  wallet: string;
  tier: TierLevel;
  companyName: string;
  subscriptionStart: Date;
  nextBilling: Date;
  active: boolean;
}

interface APIKey {
  keyId: string;
  keyHash: string;
  owner: string;
  tier: TierLevel;
  permissions: number;
  createdAt: Date;
  lastUsedAt: Date | null;
  usageCount: number;
  active: boolean;
}

interface UsageStats {
  totalUsage: number;
  usageToday: number;
  usageThisMinute: number;
  lastUsed: Date | null;
}

class EnterpriseKYAService {
  async getTiers(): Promise<TierConfig[]> {
    return Object.values(TIER_CONFIGS);
  }

  async getTier(tier: string): Promise<TierConfig | null> {
    return TIER_CONFIGS[tier.toUpperCase()] || null;
  }

  async subscribe(
    wallet: string,
    tier: string,
    companyName: string
  ): Promise<{ success: boolean; client?: EnterpriseClient; apiKey?: APIKey }> {
    const tierConfig = TIER_CONFIGS[tier.toUpperCase()];
    if (!tierConfig) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    if (tier === "FREE") {
      throw new Error("Use free tier without subscription");
    }

    const existingClient = await prisma.enterpriseClient.findFirst({
      where: { wallet: wallet.toLowerCase(), active: true },
    });

    if (existingClient) {
      if (existingClient.tier === tier.toUpperCase()) {
        throw new Error("Already subscribed to this tier");
      }

      await prisma.enterpriseClient.update({
        where: { id: existingClient.id },
        data: {
          tier: tier.toUpperCase(),
          companyName,
          subscriptionStart: new Date(),
          nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      await prisma.enterpriseClient.create({
        data: {
          wallet: wallet.toLowerCase(),
          tier: tier.toUpperCase(),
          companyName,
          subscriptionStart: new Date(),
          nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          active: true,
        },
      });
    }

    const apiKey = await this.createAPIKey(wallet, tier);

    return {
      success: true,
      client: {
        wallet,
        tier: tier.toUpperCase() as TierLevel,
        companyName,
        subscriptionStart: new Date(),
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true,
      },
      apiKey,
    };
  }

  async createAPIKey(wallet: string, tier: string): Promise<APIKey> {
    const tierConfig = TIER_CONFIGS[tier.toUpperCase()];
    if (!tierConfig) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    const apiKey = uuidv4().replace(/-/g, "");
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const key = await prisma.apiKey.create({
      data: {
        key: keyHash,
        name: `${tier.toUpperCase()} API Key`,
        permissions: ["read:agents", "read:scores", "verify:agents"],
        rateLimit: tierConfig.requestsPerMinute,
        owner: wallet.toLowerCase(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      keyId: key.id,
      keyHash: key.key,
      owner: wallet,
      tier: tier.toUpperCase() as TierLevel,
      permissions: 0xff,
      createdAt: new Date(),
      lastUsedAt: null,
      usageCount: 0,
      active: true,
    };
  }

  async revokeAPIKey(keyId: string, wallet: string): Promise<boolean> {
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, owner: wallet.toLowerCase() },
    });

    if (!apiKey) {
      throw new Error("API key not found");
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { active: false },
    });

    return true;
  }

  async validateAPIKey(apiKey: string): Promise<{
    valid: boolean;
    tier?: string;
    permissions?: string[];
    rateLimit?: number;
    owner?: string;
  }> {
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const key = await prisma.apiKey.findFirst({
      where: { key: keyHash, active: true },
      include: { owner: true },
    });

    if (!key) {
      return { valid: false };
    }

    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return { valid: false };
    }

    await prisma.apiKey.update({
      where: { id: key.id },
      data: {
        lastUsedAt: new Date(),
        requestsUsed: { increment: 1 },
      },
    });

    return {
      valid: true,
      tier: key.name.includes("STARTER")
        ? "STARTER"
        : key.name.includes("PROFESSIONAL")
        ? "PROFESSIONAL"
        : key.name.includes("ENTERPRISE")
        ? "ENTERPRISE"
        : "UNLIMITED",
      permissions: key.permissions,
      rateLimit: key.rateLimit,
      owner: key.owner,
    };
  }

  async getUsageStats(wallet: string): Promise<UsageStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const keys = await prisma.apiKey.findMany({
      where: { owner: wallet.toLowerCase(), active: true },
    });

    let totalUsage = 0;
    let usageToday = 0;

    for (const key of keys) {
      totalUsage += key.requestsUsed;

      if (key.lastUsedAt && new Date(key.lastUsedAt) >= today) {
        usageToday += 1;
      }
    }

    return {
      totalUsage,
      usageToday,
      usageThisMinute: 0,
      lastUsed: keys[0]?.lastUsedAt || null,
    };
  }

  async getClientInfo(wallet: string): Promise<{
    client: EnterpriseClient | null;
    apiKeys: APIKey[];
    usage: UsageStats;
  }> {
    const client = await prisma.enterpriseClient.findFirst({
      where: { wallet: wallet.toLowerCase(), active: true },
    });

    const keys = await prisma.apiKey.findMany({
      where: { owner: wallet.toLowerCase() },
    });

    const apiKeys: APIKey[] = keys.map((k) => ({
      keyId: k.id,
      keyHash: k.key,
      owner: k.owner,
      tier: k.name.includes("STARTER")
        ? TierLevel.STARTER
        : k.name.includes("PROFESSIONAL")
        ? TierLevel.PROFESSIONAL
        : k.name.includes("ENTERPRISE")
        ? TierLevel.ENTERPRISE
        : TierLevel.UNLIMITED,
      permissions: 0xff,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      usageCount: k.requestsUsed,
      active: k.active,
    }));

    const usage = await this.getUsageStats(wallet);

    return {
      client: client
        ? {
            wallet: client.wallet,
            tier: client.tier as TierLevel,
            companyName: client.companyName || "",
            subscriptionStart: client.subscriptionStart,
            nextBilling: client.nextBilling,
            active: client.active,
          }
        : null,
      apiKeys,
      usage,
    };
  }

  async cancelSubscription(wallet: string): Promise<boolean> {
    const client = await prisma.enterpriseClient.findFirst({
      where: { wallet: wallet.toLowerCase(), active: true },
    });

    if (!client) {
      throw new Error("No active subscription found");
    }

    await prisma.enterpriseClient.update({
      where: { id: client.id },
      data: { active: false },
    });

    await prisma.apiKey.updateMany({
      where: { owner: wallet.toLowerCase() },
      data: { active: false },
    });

    return true;
  }

  async verifyAgent(
    apiKey: string,
    agentWallet: string
  ): Promise<{
    isVerified: boolean;
    score?: number;
    tier?: string;
    tokenId?: string;
  }> {
    const validation = await this.validateAPIKey(apiKey);
    if (!validation.valid) {
      throw new Error("Invalid API key");
    }

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: agentWallet.toLowerCase() },
    });

    if (!agent) {
      return { isVerified: false };
    }

    return {
      isVerified: agent.isActive,
      score: agent.ewmaScore,
      tier: agent.tier,
      tokenId: agent.tokenId.toString(),
    };
  }

  async batchVerifyAgents(
    apiKey: string,
    agentWallets: string[]
  ): Promise<boolean[]> {
    const validation = await this.validateAPIKey(apiKey);
    if (!validation.valid) {
      throw new Error("Invalid API key");
    }

    const tierConfig = TIER_CONFIGS[validation.tier || "FREE"];
    if (agentWallets.length > tierConfig.batchSizeLimit) {
      throw new Error(`Batch size exceeds limit of ${tierConfig.batchSizeLimit}`);
    }

    const results: boolean[] = [];

    for (const wallet of agentWallets) {
      const agent = await prisma.agent.findUnique({
        where: { agentAddr: wallet.toLowerCase() },
      });

      results.push(agent?.isActive || false);
    }

    return results;
  }

  async getAgentProfile(
    apiKey: string,
    agentWallet: string
  ): Promise<any> {
    const validation = await this.validateAPIKey(apiKey);
    if (!validation.valid) {
      throw new Error("Invalid API key");
    }

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: agentWallet.toLowerCase() },
      include: {
        tasks: { take: 10, orderBy: { createdAt: "desc" } },
        reputationHistory: { take: 20, orderBy: { createdAt: "desc" } },
      },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    const tierConfig = TIER_CONFIGS[agent.tier] || TIER_CONFIGS.FREE;

    return {
      agentWallet: agent.agentAddr,
      tokenId: agent.tokenId.toString(),
      identity: {
        displayName: agent.displayName,
        description: agent.description,
        avatarUrl: agent.avatarIpfs ? `https://ipfs.io/ipfs/${agent.avatarIpfs}` : null,
        registeredAt: agent.registeredAt.getTime(),
        isActive: agent.isActive,
      },
      classification: {
        type: agent.agentType.toLowerCase(),
        subType: agent.subType,
        specializations: agent.specializations,
      },
      reputation: {
        tier: agent.tier,
        tierLabel: agent.tier,
        ewmaScore: agent.ewmaScore,
        rawScore: agent.rawScore,
        tierProgress: this.calculateTierProgress(agent.ewmaScore, agent.tier),
      },
      performance: {
        tasksCompleted: agent.tasksCompleted,
        tasksFailed: agent.tasksFailed,
        winRate:
          agent.tasksCompleted + agent.tasksFailed > 0
            ? agent.tasksCompleted / (agent.tasksCompleted + agent.tasksFailed)
            : 0,
        avgQualityScore: 0,
        totalUsdcProcessed: Number(agent.totalUsdcProcessed) / 1e6,
      },
      verification: {
        verified: agent.isActive,
        lastVerifiedAt: agent.lastActiveAt?.getTime() || agent.registeredAt.getTime(),
        verificationLevel: tierConfig.name,
      },
    };
  }

  private calculateTierProgress(
    score: number,
    currentTier: string
  ): { current: number; required: number; percentage: number } {
    const tierThresholds: Record<string, number> = {
      UNRANKED: 0,
      BRONZE: 5000,
      SILVER: 7500,
      GOLD: 8500,
      PLATINUM: 9500,
    };

    const tierOrder = ["UNRANKED", "BRONZE", "SILVER", "GOLD", "PLATINUM"];
    const currentIndex = tierOrder.indexOf(currentTier);
    const nextTier = tierOrder[currentIndex + 1];

    if (!nextTier) {
      return { current: score, required: 10000, percentage: 100 };
    }

    const currentThreshold = tierThresholds[currentTier] || 0;
    const nextThreshold = tierThresholds[nextTier];
    const range = nextThreshold - currentThreshold;
    const progress = score - currentThreshold;

    return {
      current: progress,
      required: range,
      percentage: Math.min(100, Math.round((progress / range) * 100)),
    };
  }

  async getSLACompliance(wallet: string): Promise<{
    compliant: boolean;
    uptimeBps: number;
    maxLatencyMs: number;
    responseTimeHours: number;
  }> {
    const client = await prisma.enterpriseClient.findFirst({
      where: { wallet: wallet.toLowerCase(), active: true },
    });

    if (!client) {
      return {
        compliant: false,
        uptimeBps: 0,
        maxLatencyMs: 0,
        responseTimeHours: 0,
      };
    }

    const tierConfig = TIER_CONFIGS[client.tier] || TIER_CONFIGS.FREE;

    return {
      compliant: tierConfig.hasSla,
      uptimeBps: tierConfig.slaUptimeBps,
      maxLatencyMs: tierConfig.maxLatencyMs,
      responseTimeHours: tierConfig.supportResponseHours,
    };
  }
}

export const enterpriseKyaService = new EnterpriseKYAService();
export { TierLevel, TierConfig };
