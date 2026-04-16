import { prisma } from "../config/database";
import { blockchainService } from "./blockchain";
import { logger } from "../utils/logger";
import axios from "axios";

interface BridgeRecord {
  agentWallet: string;
  targetChain: number;
  scoreAtBridge: number;
  tierAtBridge: number;
  bridgedAt: Date;
  lastSyncedAt: Date;
  syncCount: number;
  active: boolean;
}

interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  bridgeAddress: string;
  explorerUrl: string;
}

const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  10: {
    chainId: 10,
    name: "Optimism",
    rpcUrl: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
    bridgeAddress: "",
    explorerUrl: "https://optimistic.etherscan.io",
  },
  42161: {
    chainId: 42161,
    name: "Arbitrum",
    rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
    bridgeAddress: "",
    explorerUrl: "https://arbiscan.io",
  },
  137: {
    chainId: 137,
    name: "Polygon",
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    bridgeAddress: "",
    explorerUrl: "https://polygonscan.com",
  },
  8453: {
    chainId: 8453,
    name: "Base",
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    bridgeAddress: "",
    explorerUrl: "https://basescan.org",
  },
};

class CrossChainBridgeService {
  private readonly CANONICAL_CHAIN_ID = 8453;

  async bridgeReputation(
    agentWallet: string,
    targetChain: number
  ): Promise<{ success: boolean; txHash?: string; bridgeRecord?: any }> {
    if (targetChain === this.CANONICAL_CHAIN_ID) {
      throw new Error("Cannot bridge to canonical chain");
    }

    if (!CHAIN_CONFIGS[targetChain]) {
      throw new Error(`Unsupported chain: ${targetChain}`);
    }

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: agentWallet },
    });

    if (!agent) {
      throw new Error("Agent not registered");
    }

    if (!agent.isActive) {
      throw new Error("Agent is not active");
    }

    const score = agent.ewmaScore;
    const tier = this.tierToNumber(agent.tier);

    const proofHash = await this.generateProofHash(agentWallet, score, agent.tokenId.toString());

    const bridgeRecord = await prisma.crossChainBridge.create({
      data: {
        agentId: agent.id,
        agentWallet,
        targetChain,
        sourceChain: this.CANONICAL_CHAIN_ID,
        scoreAtBridge: score,
        tierAtBridge: tier,
        status: "PENDING",
        proofHash,
      },
    });

    try {
      const txHash = await blockchainService.bridgeReputation(targetChain, proofHash);

      await prisma.crossChainBridge.update({
        where: { id: bridgeRecord.id },
        data: {
          status: "BRIDGED",
          txHash,
          bridgedAt: new Date(),
        },
      });

      logger.info(`Reputation bridged for ${agentWallet} to chain ${targetChain}`, {
        txHash,
        score,
        tier,
      });

      return {
        success: true,
        txHash,
        bridgeRecord: {
          ...bridgeRecord,
          status: "BRIDGED",
        },
      };
    } catch (error) {
      await prisma.crossChainBridge.update({
        where: { id: bridgeRecord.id },
        data: {
          status: "FAILED",
          errorMessage: (error as Error).message,
        },
      });

      throw error;
    }
  }

  async syncScore(
    agentWallet: string,
    targetChain: number
  ): Promise<{ success: boolean; syncRecord?: any }> {
    const bridgeRecord = await prisma.crossChainBridge.findFirst({
      where: {
        agentWallet,
        targetChain,
        status: "BRIDGED",
      },
      orderBy: { bridgedAt: "desc" },
    });

    if (!bridgeRecord) {
      throw new Error("No active bridge found");
    }

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: agentWallet },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    const currentScore = agent.ewmaScore;

    if (currentScore === bridgeRecord.scoreAtBridge) {
      return { success: true, syncRecord: null };
    }

    const syncRecord = await prisma.crossChainSync.create({
      data: {
        bridgeId: bridgeRecord.id,
        agentWallet,
        targetChain,
        oldScore: bridgeRecord.scoreAtBridge,
        newScore: currentScore,
        status: "PENDING",
      },
    });

    try {
      await blockchainService.syncScore(agentWallet, targetChain, currentScore);

      await prisma.crossChainSync.update({
        where: { id: syncRecord.id },
        data: {
          status: "COMPLETED",
          syncedAt: new Date(),
        },
      });

      await prisma.crossChainBridge.update({
        where: { id: bridgeRecord.id },
        data: {
          scoreAtBridge: currentScore,
          lastSyncedAt: new Date(),
          syncCount: { increment: 1 },
        },
      });

      logger.info(`Score synced for ${agentWallet} on chain ${targetChain}`, {
        oldScore: bridgeRecord.scoreAtBridge,
        newScore: currentScore,
      });

      return { success: true, syncRecord };
    } catch (error) {
      await prisma.crossChainSync.update({
        where: { id: syncRecord.id },
        data: {
          status: "FAILED",
          errorMessage: (error as Error).message,
        },
      });

      throw error;
    }
  }

  async deactivateBridge(
    agentWallet: string,
    targetChain: number
  ): Promise<{ success: boolean }> {
    const bridgeRecord = await prisma.crossChainBridge.findFirst({
      where: {
        agentWallet,
        targetChain,
        status: "BRIDGED",
      },
    });

    if (!bridgeRecord) {
      throw new Error("No active bridge found");
    }

    await prisma.crossChainBridge.update({
      where: { id: bridgeRecord.id },
      data: {
        status: "DEACTIVATED",
        deactivatedAt: new Date(),
      },
    });

    logger.info(`Bridge deactivated for ${agentWallet} on chain ${targetChain}`);

    return { success: true };
  }

  async getBridgeRecords(agentWallet: string): Promise<any[]> {
    const bridges = await prisma.crossChainBridge.findMany({
      where: { agentWallet },
      orderBy: { bridgedAt: "desc" },
    });

    return bridges.map((bridge) => ({
      id: bridge.id,
      agentWallet: bridge.agentWallet,
      targetChain: bridge.targetChain,
      targetChainName: CHAIN_CONFIGS[bridge.targetChain]?.name || "Unknown",
      sourceChain: bridge.sourceChain,
      scoreAtBridge: bridge.scoreAtBridge,
      tierAtBridge: bridge.tierAtBridge,
      status: bridge.status,
      bridgedAt: bridge.bridgedAt,
      lastSyncedAt: bridge.lastSyncedAt,
      syncCount: bridge.syncCount,
      txHash: bridge.txHash,
      explorerUrl: bridge.txHash
        ? `${CHAIN_CONFIGS[bridge.targetChain]?.explorerUrl}/tx/${bridge.txHash}`
        : null,
    }));
  }

  async getChainStats(chainId: number): Promise<any> {
    const bridges = await prisma.crossChainBridge.findMany({
      where: {
        targetChain: chainId,
        status: "BRIDGED",
      },
    });

    const syncs = await prisma.crossChainSync.findMany({
      where: {
        targetChain: chainId,
        status: "COMPLETED",
      },
    });

    return {
      chainId,
      chainName: CHAIN_CONFIGS[chainId]?.name || "Unknown",
      totalBridges: bridges.length,
      activeBridges: bridges.filter((b) => b.status === "BRIDGED").length,
      totalSyncs: syncs.length,
      averageScore: bridges.length > 0
        ? bridges.reduce((sum, b) => sum + b.scoreAtBridge, 0) / bridges.length
        : 0,
    };
  }

  async getSupportedChains(): Promise<ChainConfig[]> {
    return Object.values(CHAIN_CONFIGS).filter((c) => c.chainId !== this.CANONICAL_CHAIN_ID);
  }

  async verifyReputation(
    agentWallet: string,
    targetChain: number
  ): Promise<{ valid: boolean; score?: number; tier?: number; bridgedAt?: Date }> {
    const bridgeRecord = await prisma.crossChainBridge.findFirst({
      where: {
        agentWallet,
        targetChain,
        status: "BRIDGED",
      },
    });

    if (!bridgeRecord) {
      return { valid: false };
    }

    return {
      valid: true,
      score: bridgeRecord.scoreAtBridge,
      tier: bridgeRecord.tierAtBridge,
      bridgedAt: bridgeRecord.bridgedAt,
    };
  }

  async getCanonicalScore(agentWallet: string): Promise<number> {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: agentWallet },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    return agent.ewmaScore;
  }

  private async generateProofHash(
    agentWallet: string,
    score: number,
    tokenId: string
  ): Promise<string> {
    const timestamp = Date.now();
    const data = `${agentWallet}:${score}:${tokenId}:${timestamp}`;
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return "0x" + hashHex;
  }

  private tierToNumber(tier: string): number {
    const tierMap: Record<string, number> = {
      UNRANKED: 0,
      BRONZE: 1,
      SILVER: 2,
      GOLD: 3,
      PLATINUM: 4,
    };
    return tierMap[tier] || 0;
  }

  async getBridgeDashboard(): Promise<any> {
    const totalBridges = await prisma.crossChainBridge.count();
    const activeBridges = await prisma.crossChainBridge.count({
      where: { status: "BRIDGED" },
    });
    const totalSyncs = await prisma.crossChainSync.count({
      where: { status: "COMPLETED" },
    });

    const chainStats = await Promise.all(
      [10, 42161, 137].map(async (chainId) => {
        const stats = await this.getChainStats(chainId);
        return stats;
      })
    );

    return {
      summary: {
        totalBridges,
        activeBridges,
        totalSyncs,
        chainsSupported: 3,
      },
      byChain: chainStats,
    };
  }
}

export const crossChainBridgeService = new CrossChainBridgeService();
