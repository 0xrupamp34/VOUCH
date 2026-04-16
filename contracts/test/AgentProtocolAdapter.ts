import { expect } from "chai";
import { ethers, deployments, getNamedAccounts } from "hardhat";
import { AgentRegistry, ReputationEngine, AgentProtocolAdapter } from "../typechain-types";
import { Signer } from "ethers";

describe("AgentProtocolAdapter", function () {
  let protocolAdapter: AgentProtocolAdapter;
  let agentRegistry: AgentRegistry;
  let reputationEngine: ReputationEngine;
  let owner: Signer;
  let agent1: Signer;
  let agent2: Signer;
  let verifier: Signer;

  const AGENT_NAME = "Test Agent";
  const METADATA_HASH = ethers.keccak256(ethers.toUtf8Bytes("metadata"));
  const CAPABILITY_CODE = ethers.keccak256(ethers.toUtf8Bytes("code_generation"));

  beforeEach(async () => {
    [owner, agent1, agent2, verifier] = await ethers.getSigners();

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

    await agentRegistry.deployTransaction.wait();
    await reputationEngine.deployTransaction.wait();

    agentRegistry = await ethers.getContract("AgentRegistry", owner);
    reputationEngine = await ethers.getContract("ReputationEngine", owner);

    const protocolAdapterDeployed = await deploy("AgentProtocolAdapter", {
      from: await owner.getAddress(),
      args: [agentRegistry.address, reputationEngine.address],
      log: true,
    });

    protocolAdapter = await ethers.getContract("AgentProtocolAdapter", owner);

    await agentRegistry.connect(owner).setVerifier(await verifier.getAddress());
  });

  describe("MCP Agent Registration", function () {
    it("should register an MCP agent", async function () {
      const tokenId = 1;
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        0,
        { gasLimit: 500000 }
      );

      const capabilities = [CAPABILITY_CODE];
      await protocolAdapter.connect(agent1).registerMCPAgent(
        agentWallet,
        "https://mcp.example.com",
        capabilities
      );

      const [isVerified, isCompatible] = await protocolAdapter.verifyAgentProtocol(
        agentWallet,
        "mcp"
      );

      expect(isVerified).to.be.true;
      expect(isCompatible).to.be.true;
    });

    it("should not register MCP agent if not verified", async function () {
      const agentWallet = await agent1.getAddress();
      const capabilities = [CAPABILITY_CODE];

      await expect(
        protocolAdapter.connect(agent1).registerMCPAgent(
          agentWallet,
          "https://mcp.example.com",
          capabilities
        )
      ).to.be.revertedWith("Agent not verified");
    });
  });

  describe("A2A Agent Registration", function () {
    it("should register an A2A agent", async function () {
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        0,
        { gasLimit: 500000 }
      );

      const capabilities = [CAPABILITY_CODE];
      await protocolAdapter.connect(agent1).registerA2AAgent(
        agentWallet,
        "https://a2a.example.com",
        capabilities
      );

      const [isVerified, isCompatible] = await protocolAdapter.verifyAgentProtocol(
        agentWallet,
        "a2a"
      );

      expect(isVerified).to.be.true;
      expect(isCompatible).to.be.true;
    });
  });

  describe("Agent Card", function () {
    it("should return correct agent card", async function () {
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        0,
        { gasLimit: 500000 }
      );

      const card = await protocolAdapter.getAgentCard(agentWallet);

      expect(card.wallet).to.equal(agentWallet);
      expect(card.verified).to.be.true;
    });

    it("should revert for unregistered agent", async function () {
      const agentWallet = await agent1.getAddress();

      await expect(
        protocolAdapter.getAgentCard(agentWallet)
      ).to.be.revertedWith("Agent not registered");
    });
  });

  describe("Task Delegation", function () {
    it("should delegate task to compatible agent", async function () {
      const fromAgentWallet = await agent1.getAddress();
      const toAgentWallet = await agent2.getAddress();
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task1"));

      await agentRegistry.connect(verifier).registerAgent(
        fromAgentWallet,
        METADATA_HASH,
        0,
        { gasLimit: 500000 }
      );

      await agentRegistry.connect(verifier).registerAgent(
        toAgentWallet,
        METADATA_HASH,
        0,
        { gasLimit: 500000 }
      );

      await protocolAdapter.connect(agent1).registerA2AAgent(
        fromAgentWallet,
        "https://a2a.from.com",
        [CAPABILITY_CODE]
      );

      await protocolAdapter.connect(agent2).registerA2AAgent(
        toAgentWallet,
        "https://a2a.to.com",
        [CAPABILITY_CODE]
      );

      const success = await protocolAdapter.connect(agent1).delegateTaskToA2AAgent(
        fromAgentWallet,
        toAgentWallet,
        taskId,
        CAPABILITY_CODE
      );

      expect(success).to.be.true;
    });

    it("should reject delegation to agent without capability", async function () {
      const fromAgentWallet = await agent1.getAddress();
      const toAgentWallet = await agent2.getAddress();
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task1"));

      await agentRegistry.connect(verifier).registerAgent(
        fromAgentWallet,
        METADATA_HASH,
        0,
        { gasLimit: 500000 }
      );

      await agentRegistry.connect(verifier).registerAgent(
        toAgentWallet,
        METADATA_HASH,
        0,
        { gasLimit: 500000 }
      );

      await protocolAdapter.connect(agent1).registerA2AAgent(
        fromAgentWallet,
        "https://a2a.from.com",
        [CAPABILITY_CODE]
      );

      await expect(
        protocolAdapter.connect(agent1).delegateTaskToA2AAgent(
          fromAgentWallet,
          toAgentWallet,
          taskId,
          CAPABILITY_CODE
        )
      ).to.be.revertedWith("Target agent lacks required capability");
    });
  });

  describe("Compatible Agents Query", function () {
    it("should return compatible agents", async function () {
      const agent1Wallet = await agent1.getAddress();
      const agent2Wallet = await agent2.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agent1Wallet,
        METADATA_HASH,
        2,
        { gasLimit: 500000 }
      );

      await agentRegistry.connect(verifier).registerAgent(
        agent2Wallet,
        METADATA_HASH,
        3,
        { gasLimit: 500000 }
      );

      await reputationEngine.connect(owner).initializeScore(2, 8500);

      await protocolAdapter.connect(agent1).registerA2AAgent(
        agent1Wallet,
        "https://a2a.agent1.com",
        [CAPABILITY_CODE]
      );

      await protocolAdapter.connect(agent2).registerA2AAgent(
        agent2Wallet,
        "https://a2a.agent2.com",
        [CAPABILITY_CODE]
      );

      const compatible = await protocolAdapter.getCompatibleAgents(
        CAPABILITY_CODE,
        2,
        0
      );

      expect(compatible.length).to.be.greaterThan(0);
    });
  });

  describe("Protocol Violation Reporting", function () {
    it("should slash score on protocol violation", async function () {
      const agentWallet = await agent1.getAddress();

      await agentRegistry.connect(verifier).registerAgent(
        agentWallet,
        METADATA_HASH,
        3,
        { gasLimit: 500000 }
      );

      await reputationEngine.connect(owner).initializeScore(1, 8500);

      const initialScore = await reputationEngine.getEWMA(1);

      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("evidence"));
      await protocolAdapter.reportProtocolViolation(
        agentWallet,
        evidenceHash,
        "misbehavior"
      );

      const newScore = await reputationEngine.getEWMA(1);
      expect(newScore).to.be.lessThan(initialScore);
    });
  });
});
