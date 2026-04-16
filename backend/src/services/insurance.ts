import { ethers, Contract, BigNumber } from "ethers";
import { config } from "../config/env";
import { logger } from "../utils/logger";

const INSURANCE_ABI = [
  "function purchaseCoverage(address agentWallet, uint256 coverageAmount, uint256 durationDays) returns (uint256 policyId)",
  "function activatePolicy(uint256 policyId)",
  "function getCoverageQuote(address agentWallet, uint256 coverageAmount, uint256 durationDays) returns (uint256 premium, uint256 maxPayout)",
  "function submitClaim(uint256 policyId, uint256 amount, string taskId, string reason) returns (uint256 claimId)",
  "function reviewClaim(uint256 claimId)",
  "function approveClaim(uint256 claimId, uint256 payoutAmount, string resolutionNotes)",
  "function denyClaim(uint256 claimId, string reason)",
  "function executePayout(uint256 claimId)",
  "function depositToReserve(uint256 amount)",
  "function withdrawFromReserve(uint256 amount, address recipient)",
  "function getAgentPolicies(address agentWallet) returns (uint256[])",
  "function getPolicyClaims(uint256 policyId) returns (uint256[])",
  "function getCoverageStats() returns (uint256, uint256, uint256, uint256, uint256)",
  "function calculateRiskScore(address agentWallet) returns (uint256)",
  "function policies(uint256) view returns (uint256, address, uint256, uint256, uint256, uint256, bool, uint256, uint256)",
  "function claims(uint256) view returns (uint256, uint256, address, uint256, string, string, uint8, uint256, uint256, string, uint256)",
  "event PolicyCreated(uint256 indexed policyId, address indexed agent, uint256 coverageAmount)",
  "event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, uint256 amount)",
  "event ClaimApproved(uint256 indexed claimId, uint256 payoutAmount)",
  "event PayoutExecuted(uint256 indexed claimId, address indexed recipient, uint256 amount)",
];

class InsuranceService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: Contract;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey || process.env.PRIVATE_KEY || "", this.provider);
    this.contract = new ethers.Contract(
      config.contracts.insurance || "",
      INSURANCE_ABI,
      this.wallet
    );
  }

  async purchaseCoverage(
    agentWallet: string,
    coverageAmountUsdc: number,
    durationDays: number
  ): Promise<{ policyId: string; txHash: string; premium: BigNumber }> {
    const coverageAmount = BigInt(Math.floor(coverageAmountUsdc * 1e6));
    
    const quote = await this.contract.getCoverageQuote(agentWallet, coverageAmount, durationDays);
    const premium = quote.premium;

    const tx = await this.contract.purchaseCoverage(agentWallet, coverageAmount, durationDays);
    const receipt = await tx.wait();

    const policyCreatedEvent = receipt.events?.find((e: any) => e.event === "PolicyCreated");
    const policyId = policyCreatedEvent?.args?.policyId?.toString() || "0";

    logger.info(`Insurance policy purchased: ${policyId}`, {
      agentWallet,
      coverageAmount: coverageAmountUsdc,
      durationDays,
      premium: premium.toString(),
    });

    return {
      policyId,
      txHash: receipt.transactionHash,
      premium,
    };
  }

  async activatePolicy(policyId: string): Promise<string> {
    const tx = await this.contract.activatePolicy(policyId);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async getCoverageQuote(
    agentWallet: string,
    coverageAmountUsdc: number,
    durationDays: number
  ): Promise<{ premium: number; maxPayout: number; discountBps: number }> {
    const coverageAmount = BigInt(Math.floor(coverageAmountUsdc * 1e6));
    const quote = await this.contract.getCoverageQuote(agentWallet, coverageAmount, durationDays);

    return {
      premium: Number(quote.premium) / 1e6,
      maxPayout: Number(quote.maxPayout) / 1e6,
      discountBps: 0,
    };
  }

  async submitClaim(
    policyId: string,
    amountUsdc: number,
    taskId: string,
    reason: string
  ): Promise<{ claimId: string; txHash: string }> {
    const amount = BigInt(Math.floor(amountUsdc * 1e6));

    const tx = await this.contract.submitClaim(policyId, amount, taskId, reason);
    const receipt = await tx.wait();

    const claimEvent = receipt.events?.find((e: any) => e.event === "ClaimSubmitted");
    const claimId = claimEvent?.args?.claimId?.toString() || "0";

    logger.info(`Insurance claim submitted: ${claimId}`, { policyId, amount: amountUsdc });

    return {
      claimId,
      txHash: receipt.transactionHash,
    };
  }

  async reviewClaim(claimId: string): Promise<string> {
    const tx = await this.contract.reviewClaim(claimId);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async approveClaim(
    claimId: string,
    payoutAmountUsdc: number,
    resolutionNotes: string
  ): Promise<string> {
    const payoutAmount = BigInt(Math.floor(payoutAmountUsdc * 1e6));

    const tx = await this.contract.approveClaim(claimId, payoutAmount, resolutionNotes);
    const receipt = await tx.wait();

    logger.info(`Insurance claim approved: ${claimId}`, { payoutAmount: payoutAmountUsdc });

    return receipt.transactionHash;
  }

  async denyClaim(claimId: string, reason: string): Promise<string> {
    const tx = await this.contract.denyClaim(claimId, reason);
    const receipt = await tx.wait();

    logger.warn(`Insurance claim denied: ${claimId}`, { reason });

    return receipt.transactionHash;
  }

  async executePayout(claimId: string): Promise<string> {
    const tx = await this.contract.executePayout(claimId);
    const receipt = await tx.wait();

    logger.info(`Insurance payout executed: ${claimId}`);

    return receipt.transactionHash;
  }

  async getAgentPolicies(agentWallet: string): Promise<any[]> {
    const policyIds = await this.contract.getAgentPolicies(agentWallet);
    
    const policies = await Promise.all(
      policyIds.map(async (id: BigNumber) => {
        const policy = await this.contract.policies(id);
        return {
          policyId: id.toString(),
          agentWallet: policy.agentWallet,
          coverageAmount: Number(policy.coverageAmount) / 1e6,
          premiumPaid: Number(policy.premiumPaid) / 1e6,
          startTime: new Date(policy.startTime * 1000),
          endTime: new Date(policy.endTime * 1000),
          active: policy.active,
          maxClaimable: Number(policy.maxClaimable) / 1e6,
          claimedAmount: Number(policy.claimedAmount) / 1e6,
        };
      })
    );

    return policies;
  }

  async getCoverageStats(): Promise<{
    totalPremiumsCollected: number;
    totalClaimsPaid: number;
    reserveBalance: number;
    activePolicies: number;
    pendingClaims: number;
  }> {
    const stats = await this.contract.getCoverageStats();

    return {
      totalPremiumsCollected: Number(stats._totalPremiumsCollected) / 1e6,
      totalClaimsPaid: Number(stats._totalClaimsPaid) / 1e6,
      reserveBalance: Number(stats._reserveBalance) / 1e6,
      activePolicies: Number(stats._activePolicies),
      pendingClaims: Number(stats._pendingClaims),
    };
  }

  async calculateRiskScore(agentWallet: string): Promise<number> {
    const riskScore = await this.contract.calculateRiskScore(agentWallet);
    return Number(riskScore);
  }

  async getClaimDetails(claimId: string): Promise<any> {
    const claim = await this.contract.claims(claimId);

    const statusMap: Record<number, string> = {
      0: "SUBMITTED",
      1: "UNDER_REVIEW",
      2: "APPROVED",
      3: "DENIED",
      4: "APPEALED",
      5: "RESOLVED",
    };

    return {
      claimId: claim.claimId.toString(),
      policyId: claim.policyId.toString(),
      claimant: claim.claimant,
      amount: Number(claim.amount) / 1e6,
      taskId: claim.taskId,
      reason: claim.reason,
      status: statusMap[Number(claim.status)] || "UNKNOWN",
      submittedAt: new Date(claim.submittedAt * 1000),
      resolvedAt: claim.resolvedAt > 0 ? new Date(claim.resolvedAt * 1000) : null,
      resolutionNotes: claim.resolutionNotes,
      payoutAmount: Number(claim.payoutAmount) / 1e6,
    };
  }
}

export const insuranceService = new InsuranceService();
