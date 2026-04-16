import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { AgentRegistry, ReputationEngine, AgentInsurance } from "../typechain-types";
import { Signer, BigNumber } from "ethers";
import { MockContract } from "@nomicfoundation/hardhat-chai-matchers";
import { getContractAt } from "@nomicfoundation/hardhat-ethers/helpers";

describe("AgentInsurance", function () {
  let insurance: AgentInsurance;
  let agentRegistry: AgentRegistry;
  let reputationEngine: ReputationEngine;
  let usdc: MockContract;
  let owner: Signer;
  let agent1: Signer;
  let agent2: Signer;
  let verifier: Signer;
  let treasury: Signer;

  const METADATA_HASH = ethers.keccak256(ethers.toUtf8Bytes("metadata"));
  const MIN_COVERAGE = 1000000;
  const MAX_COVERAGE = 100000000000;

  beforeEach(async () => {
    [owner, agent1, agent2, verifier, treasury] = await ethers.getSigners();

    const { deploy } = deployments;

    const agentRegistryDeployed = await deploy("AgentRegistry", {
      from: await owner.getAddress(),
      args: [],
      log: true,
    });

    const reputationEngineDeployed = await deploy("ReputationEngine", {
      from: await owner.getAddress(),
      args: [agentRegistryDeployed.address],
      log: true,
    });

    const usdcDeployed = await deploy("MockERC20", {
      from: await owner.getAddress(),
      args: ["USD Coin", "USDC", 6],
      log: true,
    });

    await agentRegistry.deployTransaction.wait();
    await reputationEngine.deployTransaction.wait();
    await usdcDeployed.deployTransaction.wait();

    agentRegistry = await ethers.getContract("AgentRegistry", owner);
    reputationEngine = await ethers.getContract("ReputationEngine", owner);
    usdc = await getContractAt("MockERC20", usdcDeployed.address, owner);

    const insuranceDeployed = await deploy("AgentInsurance", {
      from: await owner.getAddress(),
      args: [agentRegistry.address, reputationEngine.address, usdc.address],
      log: true,
    });

    insurance = await ethers.getContract("AgentInsurance", owner);

    await agentRegistry.connect(owner).setVerifier(await verifier.getAddress());

    await usdc.mint(await agent1.getAddress(), ethers.parseUnits("1000000", 6));
    await usdc.mint(await agent2.getAddress(), ethers.parseUnits("1000000", 6));
  });

  describe("Coverage Purchase", function () {
    it("should purchase coverage for verified agent", async function () {
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        2,
        { gasLimit: 500000 }
      );

      await reputationEngine.connect(owner).initializeScore(1, 7500);

      const coverageAmount = BigInt(10000 * 1e6);
      const durationDays = 90;
      const premium = (coverageAmount * 250n * BigInt(durationDays)) / (36500n);

      await usdc.connect(agent1).approve(insurance.target, premium);

      const tx = await insurance.connect(agent1).purchaseCoverage(
        agentWallet,
        coverageAmount,
        durationDays
      );

      const receipt = await tx.wait();
      const event = receipt.logs?.find((log: any) => {
        try {
          const parsed = insurance.interface.parseLog(log);
          return parsed?.name === "PolicyCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const policies = await insurance.getAgentPolicies(agentWallet);
      expect(policies.length).to.be.greaterThan(0);
    });

    it("should reject coverage below minimum", async function () {
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        2,
        { gasLimit: 500000 }
      );

      await expect(
        insurance.connect(agent1).purchaseCoverage(
          agentWallet,
          500000,
          90
        )
      ).to.be.revertedWith("Coverage below minimum");
    });

    it("should reject coverage above maximum", async function () {
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        2,
        { gasLimit: 500000 }
      );

      await expect(
        insurance.connect(agent1).purchaseCoverage(
          agentWallet,
          BigInt(MAX_COVERAGE) + BigInt(1),
          90
        )
      ).to.be.revertedWith("Coverage exceeds maximum");
    });

    it("should reject invalid duration", async function () {
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        2,
        { gasLimit: 500000 }
      );

      await expect(
        insurance.connect(agent1).purchaseCoverage(
          agentWallet,
          BigInt(10000 * 1e6),
          10
        )
      ).to.be.revertedWith("Invalid duration");
    });
  });

  describe("Coverage Quote", function () {
    it("should return accurate quote", async function () {
      const agentWallet = await agent1.getAddress();
      const coverageAmount = BigInt(10000 * 1e6);
      const durationDays = 90;

      const [premium, maxPayout] = await insurance.getCoverageQuote(
        agentWallet,
        coverageAmount,
        durationDays
      );

      expect(maxPayout).to.equal(coverageAmount);
      const expectedPremium = (coverageAmount * 250n * BigInt(durationDays)) / (36500n);
      expect(premium).to.be.closeTo(expectedPremium, 1000);
    });

    it("should apply discount for high-tier agents", async function () {
      const agentWallet = await agent1.getAddress();
      const coverageAmount = BigInt(10000 * 1e6);
      const durationDays = 90;

      const [premiumLowTier, _] = await insurance.getCoverageQuote(
        agentWallet,
        coverageAmount,
        durationDays
      );

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        4,
        { gasLimit: 500000 }
      );

      await reputationEngine.connect(owner).initializeScore(1, 8500);

      const [premiumHighTier, __] = await insurance.getCoverageQuote(
        agentWallet,
        coverageAmount,
        durationDays
      );

      expect(premiumHighTier).to.be.lessThan(premiumLowTier);
    });
  });

  describe("Claim Submission", function () {
    let policyId: BigNumber;

    beforeEach(async () => {
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        2,
        { gasLimit: 500000 }
      );

      await reputationEngine.connect(owner).initializeScore(1, 7500);

      const coverageAmount = BigInt(10000 * 1e6);
      const durationDays = 90;
      const premium = (coverageAmount * 250n * BigInt(durationDays)) / (36500n);

      await usdc.connect(agent1).approve(insurance.target, premium);

      const tx = await insurance.connect(agent1).purchaseCoverage(
        agentWallet,
        coverageAmount,
        durationDays
      );

      const receipt = await tx.wait();
      const event = receipt.logs?.find((log: any) => {
        try {
          const parsed = insurance.interface.parseLog(log);
          return parsed?.name === "PolicyCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = insurance.interface.parseLog(event);
        policyId = parsed?.args?.policyId;
      }
    });

    it("should submit a claim", async function () {
      const policy = await insurance.policies(policyId);
      
      const tx = await insurance.connect(agent1).submitClaim(
        policyId,
        BigInt(1000 * 1e6),
        ethers.keccak256(ethers.toUtf8Bytes("task1")),
        "Task failed due to external factors"
      );

      const receipt = await tx.wait();
      const event = receipt.logs?.find((log: any) => {
        try {
          const parsed = insurance.interface.parseLog(log);
          return parsed?.name === "ClaimSubmitted";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
    });

    it("should reject claim exceeding coverage", async function () {
      await expect(
        insurance.connect(agent1).submitClaim(
          policyId,
          BigInt(20000 * 1e6),
          ethers.keccak256(ethers.toUtf8Bytes("task1")),
          "Large claim"
        )
      ).to.be.revertedWith("Exceeds coverage");
    });
  });

  describe("Claim Review", function () {
    it("should move claim to under review", async function () {
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        2,
        { gasLimit: 500000 }
      );

      await reputationEngine.connect(owner).initializeScore(1, 7500);

      await usdc.connect(agent1).approve(
        insurance.target,
        BigInt(10000 * 1e6)
      );

      const policyTx = await insurance.connect(agent1).purchaseCoverage(
        agentWallet,
        BigInt(10000 * 1e6),
        90
      );
      const policyReceipt = await policyTx.wait();

      const claimTx = await insurance.connect(agent1).submitClaim(
        1,
        BigInt(1000 * 1e6),
        ethers.keccak256(ethers.toUtf8Bytes("task1")),
        "Task failed"
      );
      await claimTx.wait();

      const reviewTx = await insurance.connect(owner).reviewClaim(1);
      await reviewTx.wait();

      const claim = await insurance.claims(1);
      expect(claim.status).to.equal(1);
    });
  });

  describe("Claim Approval", function () {
    it("should approve and pay out claim", async function () {
      const agentWallet = await agent1.getAddress();
      const ownerAddress = await owner.getAddress();

      await usdc.mint(insurance.target, ethers.parseUnits("100000", 6));

      await insurance.connect(owner).approveClaim(
        1,
        BigInt(1000 * 1e6),
        "Claim approved"
      );

      const claim = await insurance.claims(1);
      expect(claim.status).to.equal(2);
      expect(claim.payoutAmount).to.equal(BigInt(1000 * 1e6));
    });
  });

  describe("Reserve Management", function () {
    it("should deposit to reserve", async function () {
      const amount = BigInt(10000 * 1e6);

      await usdc.connect(owner).approve(insurance.target, amount);
      await insurance.connect(owner).depositToReserve(amount);

      const stats = await insurance.getCoverageStats();
      expect(stats._reserveBalance).to.equal(amount);
    });

    it("should withdraw from reserve", async function () {
      const depositAmount = BigInt(10000 * 1e6);
      const withdrawAmount = BigInt(5000 * 1e6);

      await usdc.connect(owner).approve(insurance.target, depositAmount);
      await insurance.connect(owner).depositToReserve(depositAmount);

      const treasuryAddress = await treasury.getAddress();
      await insurance.connect(owner).withdrawFromReserve(withdrawAmount, treasuryAddress);

      const stats = await insurance.getCoverageStats();
      expect(stats._reserveBalance).to.equal(withdrawAmount);
    });
  });

  describe("Risk Score Calculation", function () {
    it("should calculate higher risk for new agents", async function () {
      const agentWallet = await agent1.getAddress();

      const riskScore = await insurance.calculateRiskScore(agentWallet);
      expect(riskScore).to.equal(10000);
    });

    it("should calculate lower risk for experienced agents", async function () {
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        2,
        { gasLimit: 500000 }
      );

      await reputationEngine.connect(owner).initializeScore(1, 7500);

      const riskScore = await insurance.calculateRiskScore(agentWallet);
      expect(riskScore).to.be.lessThan(10000);
    });
  });
});

describe("MockERC20", function () {
  it("should mint tokens correctly", async function () {
    const [owner] = await ethers.getSigners();

    const { deploy } = deployments;
    const usdcDeployed = await deploy("MockERC20", {
      from: await owner.getAddress(),
      args: ["USD Coin", "USDC", 6],
      log: true,
    });

    const usdc = await ethers.getContractAt("MockERC20", usdcDeployed.address, owner);
    const mintAmount = ethers.parseUnits("1000", 6);

    await usdc.mint(await owner.getAddress(), mintAmount);

    expect(await usdc.balanceOf(await owner.getAddress())).to.equal(mintAmount);
  });
});
