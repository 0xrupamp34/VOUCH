import { ethers, Contract, Wallet, providers } from "ethers";
import { config } from "../config/env";
import { logger } from "../utils/logger";

class BlockchainService {
  private provider: providers.JsonRpcProvider;
  private wallet: Wallet;
  private signer: Wallet;

  private agentRegistry: Contract;
  private reputationEngine: Contract;
  private taskEscrow: Contract;
  private disputeManager: Contract;

  constructor() {
    this.provider = new providers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY || "", this.provider);
    this.signer = this.wallet.connect(this.provider);

    this.initializeContracts();
  }

  private initializeContracts() {
    const addresses = config.blockchain.contracts;

    const agentRegistryAbi = [
      "function registerAgent(address agentWallet, uint8 agentType, uint8 subType, bytes32 metadataHash, bytes32 capabilitiesHash, uint8 initialTier) returns (uint256 tokenId)",
      "function getAgent(uint256 tokenId) view returns (tuple(uint256 tokenId, address operator, address agentWallet, uint8 agentType, uint8 subType, bytes32 metadataHash, bytes32 capabilitiesHash, uint8 tier, uint64 registeredAt, bool active))",
      "function getAgentByWallet(address agentWallet) view returns (tuple(uint256 tokenId, address operator, address agentWallet, uint8 agentType, uint8 subType, bytes32 metadataHash, bytes32 capabilitiesHash, uint8 tier, uint64 registeredAt, bool active))",
      "function upgradeTier(uint256 tokenId, uint8 targetTier)",
      "function tokenIdByWallet(address agentWallet) view returns (uint256)",
      "function isAgentActive(uint256 tokenId) view returns (bool)",
    ];

    const reputationEngineAbi = [
      "function initializeScore(uint256 agentId)",
      "function getScore(uint256 agentId) view returns (int256)",
      "function calculateDelta(bool success, uint8 qualityScore, uint8 tier, bool onTime, uint256 usdcAmount) pure returns (int256)",
    ];

    const taskEscrowAbi = [
      "function createTask(uint256 agentId, uint256 usdcAmount, uint64 deadline, bytes32 requirementsHash, string title, string description) returns (bytes32)",
      "function acceptTask(bytes32 taskId)",
      "function submitCompletion(bytes32 taskId, bytes32 completionHash)",
      "function requestVerification(bytes32 taskId) returns (bytes32)",
      "function raiseDispute(bytes32 taskId, string reason)",
      "function cancelTask(bytes32 taskId)",
      "function getTask(bytes32 taskId) view returns (tuple(bytes32 taskId, address poster, uint256 agentId, uint256 amount, uint8 status, uint64 createdAt, uint64 deadline, uint64 acceptedAt, uint64 submissionDeadline, bytes32 requirementsHash, bytes32 completionHash, bytes32 oracleRequestId, uint8 qualityScore, string title))",
      "function getTaskStatus(bytes32 taskId) view returns (uint8)",
    ];

    const disputeManagerAbi = [
      "function createDispute(bytes32 taskId, string reason) returns (bytes32)",
      "function submitEvidence(bytes32 disputeId, bytes32 evidenceHash, string description)",
      "function castVote(bytes32 disputeId, uint8 decision, string reasoning)",
      "function resolveDispute(bytes32 disputeId)",
    ];

    if (addresses.agentRegistry) {
      this.agentRegistry = new Contract(addresses.agentRegistry, agentRegistryAbi, this.signer);
    }

    if (addresses.reputationEngine) {
      this.reputationEngine = new Contract(addresses.reputationEngine, reputationEngineAbi, this.signer);
    }

    if (addresses.taskEscrow) {
      this.taskEscrow = new Contract(addresses.taskEscrow, taskEscrowAbi, this.signer);
    }

    if (addresses.disputeManager) {
      this.disputeManager = new Contract(addresses.disputeManager, disputeManagerAbi, this.signer);
    }
  }

  async registerAgent(params: {
    operator: string;
    agentWallet: string;
    agentType: number;
    metadata?: string;
  }): Promise<string> {
    if (!this.agentRegistry) throw new Error("AgentRegistry not configured");

    const metadataHash = params.metadata
      ? ethers.utils.keccak256(ethers.utils.toUtf8Bytes(params.metadata))
      : ethers.utils.formatBytes32String("");

    const tx = await this.agentRegistry.registerAgent(
      params.agentWallet,
      params.agentType,
      0,
      metadataHash,
      ethers.utils.formatBytes32String(""),
      0,
      { gasLimit: 500000 }
    );

    logger.info("Agent registration tx:", tx.hash);
    await tx.wait();
    return tx.hash;
  }

  async getAgentByWallet(wallet: string): Promise<any> {
    if (!this.agentRegistry) throw new Error("AgentRegistry not configured");

    const agent = await this.agentRegistry.getAgentByWallet(wallet);
    return {
      tokenId: agent.tokenId.toString(),
      operator: agent.operator,
      agentWallet: agent.agentWallet,
      agentType: agent.agentType,
      tier: agent.tier,
      active: agent.active,
    };
  }

  async upgradeTier(agentId: string, targetTier: string): Promise<string> {
    if (!this.agentRegistry) throw new Error("AgentRegistry not configured");

    const tierMap: Record<string, number> = {
      UNRANKED: 0,
      BRONZE: 1,
      SILVER: 2,
      GOLD: 3,
      PLATINUM: 4,
    };

    const tx = await this.agentRegistry.upgradeTier(agentId, tierMap[targetTier], { gasLimit: 300000 });
    logger.info("Tier upgrade tx:", tx.hash);
    await tx.wait();
    return tx.hash;
  }

  async createTask(params: {
    poster: string;
    agentId: string;
    usdcAmount: bigint;
    deadline: number;
    title: string;
    description?: string;
    requirements?: string;
  }): Promise<string> {
    if (!this.taskEscrow) throw new Error("TaskEscrow not configured");

    const requirementsHash = params.requirements
      ? ethers.utils.keccak256(ethers.utils.toUtf8Bytes(params.requirements))
      : ethers.utils.formatBytes32String("");

    const tx = await this.taskEscrow.createTask(
      params.agentId,
      params.usdcAmount,
      params.deadline,
      requirementsHash,
      params.title,
      params.description || "",
      { gasLimit: 300000 }
    );

    logger.info("Task creation tx:", tx.hash);
    const receipt = await tx.wait();
    
    const taskCreatedEvent = receipt.events?.find((e: any) => e.event === "TaskCreated");
    if (taskCreatedEvent) {
      return taskCreatedEvent.args.taskId;
    }

    return tx.hash;
  }

  async acceptTask(taskId: string, operator: string): Promise<string> {
    if (!this.taskEscrow) throw new Error("TaskEscrow not configured");

    const signer = new Wallet(process.env.DEPLOYER_PRIVATE_KEY || "", this.provider).connect(this.provider);
    const taskEscrowWithSigner = this.taskEscrow.connect(signer);

    const tx = await taskEscrowWithSigner.acceptTask(taskId, { gasLimit: 200000 });
    logger.info("Task acceptance tx:", tx.hash);
    await tx.wait();
    return tx.hash;
  }

  async submitCompletion(taskId: string, completionHash: string): Promise<string> {
    if (!this.taskEscrow) throw new Error("TaskEscrow not configured");

    const tx = await this.taskEscrow.submitCompletion(taskId, completionHash, { gasLimit: 200000 });
    logger.info("Completion submission tx:", tx.hash);
    await tx.wait();
    return tx.hash;
  }

  async raiseDispute(taskId: string, reason: string): Promise<string> {
    if (!this.disputeManager) throw new Error("DisputeManager not configured");

    const tx = await this.disputeManager.raiseDispute(taskId, reason, { gasLimit: 200000 });
    logger.info("Dispute raised tx:", tx.hash);
    await tx.wait();
    return tx.hash;
  }

  async getTaskIdFromTx(txHash: string): Promise<string> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    const taskCreatedEvent = receipt.logs
      .map((log) => {
        try {
          return this.taskEscrow.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === "TaskCreated");

    if (taskCreatedEvent) {
      return taskCreatedEvent.args.taskId;
    }

    return txHash;
  }

  async getDisputeIdFromTx(txHash: string): Promise<string> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    const disputeCreatedEvent = receipt.logs
      .map((log) => {
        try {
          return this.disputeManager.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === "DisputeCreated");

    if (disputeCreatedEvent) {
      return disputeCreatedEvent.args.disputeId;
    }

    return txHash;
  }

  async uploadToIPFS(data: Record<string, unknown>): Promise<string> {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.ipfs.pinningKey}`,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: { name: `vouch-${Date.now()}` },
      }),
    });

    const result = await response.json();
    return result.IpfsHash;
  }

  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  async getGasPrice(): Promise<bigint> {
    return this.provider.getGasPrice();
  }
}

export const blockchainService = new BlockchainService();
