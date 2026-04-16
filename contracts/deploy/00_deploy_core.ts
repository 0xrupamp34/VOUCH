import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, execute } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const usdcAddress = network.name === "localhost" || network.name === "hardhat"
    ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Base Sepolia USDC
    : process.env.USDC_ADDRESS || "";

  console.log("Deploying VOUCH Contracts to", network.name);
  console.log("Deployer:", deployer);
  console.log("USDC Address:", usdcAddress);

  // Deploy AgentRegistry
  const agentRegistry = await deploy("AgentRegistry", {
    from: deployer,
    args: [deployer, deployer], // reputationEngine and vouchToken will be set later
    log: true,
    waitConfirmations: network.name === "localhost" ? 1 : 2,
  });

  console.log("AgentRegistry deployed to:", agentRegistry.address);

  // Deploy ReputationEngine
  const reputationEngine = await deploy("ReputationEngine", {
    from: deployer,
    args: [agentRegistry.address],
    log: true,
    waitConfirmations: network.name === "localhost" ? 1 : 2,
  });

  console.log("ReputationEngine deployed to:", reputationEngine.address);

  // Deploy TaskEscrow
  const taskEscrow = await deploy("TaskEscrow", {
    from: deployer,
    args: [usdcAddress, agentRegistry.address, reputationEngine.address],
    log: true,
    waitConfirmations: network.name === "localhost" ? 1 : 2,
  });

  console.log("TaskEscrow deployed to:", taskEscrow.address);

  // Deploy DisputeManager
  const disputeManager = await deploy("DisputeManager", {
    from: deployer,
    args: [
      agentRegistry.address,
      reputationEngine.address,
      taskEscrow.address,
      deployer, // vouchToken placeholder
    ],
    log: true,
    waitConfirmations: network.name === "localhost" ? 1 : 2,
  });

  console.log("DisputeManager deployed to:", disputeManager.address);

  // Set up cross-contract references
  console.log("Setting up cross-contract references...");

  // Update AgentRegistry with contracts
  await execute(
    "AgentRegistry",
    { from: deployer, log: true },
    "reputationEngine",
    reputationEngine.address
  );

  // Update ReputationEngine with contracts
  await execute(
    "ReputationEngine",
    { from: deployer, log: true },
    "setTaskEscrow",
    taskEscrow.address
  );

  await execute(
    "ReputationEngine",
    { from: deployer, log: true },
    "setDisputeManager",
    disputeManager.address
  );

  await execute(
    "ReputationEngine",
    { from: deployer, log: true },
    "setGovernance",
    deployer
  );

  // Update TaskEscrow with contracts
  await execute(
    "TaskEscrow",
    { from: deployer, log: true },
    "setTreasury",
    treasury || deployer
  );

  await execute(
    "TaskEscrow",
    { from: deployer, log: true },
    "setVerifier",
    deployer
  );

  await execute(
    "TaskEscrow",
    { from: deployer, log: true },
    "setGovernance",
    deployer
  );

  // Update DisputeManager with governance
  await execute(
    "DisputeManager",
    { from: deployer, log: true },
    "setGovernance",
    deployer
  );

  console.log("Cross-contract references set up successfully!");
  console.log("");
  console.log("=== Deployment Summary ===");
  console.log("AgentRegistry:", agentRegistry.address);
  console.log("ReputationEngine:", reputationEngine.address);
  console.log("TaskEscrow:", taskEscrow.address);
  console.log("DisputeManager:", disputeManager.address);
  console.log("=======================");

  // Save deployment addresses to file
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentsFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(
    deploymentsFile,
    JSON.stringify(
      {
        network: network.name,
        chainId: network.config.chainId,
        timestamp: new Date().toISOString(),
        contracts: {
          AgentRegistry: agentRegistry.address,
          ReputationEngine: reputationEngine.address,
          TaskEscrow: taskEscrow.address,
          DisputeManager: disputeManager.address,
        },
        treasury: treasury || deployer,
      },
      null,
      2
    )
  );

  console.log(`Deployment addresses saved to ${deploymentsFile}`);
};

export default func;
func.tags = ["all"];
func.dependencies = [];
