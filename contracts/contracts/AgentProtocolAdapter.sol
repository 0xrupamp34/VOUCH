// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IAgentRegistry, AgentType, Tier } from "./interfaces/IAgentRegistry.sol";
import { IReputationEngine } from "./interfaces/IReputationEngine.sol";

contract AgentProtocolAdapter {
    IAgentRegistry public agentRegistry;
    IReputationEngine public reputationEngine;

    address public mcpServer;
    address public a2aServer;

    mapping(address => mapping(bytes32 => bool)) public agentCapabilities;
    mapping(bytes32 => address) public taskAssignments;

    struct AgentCard {
        address wallet;
        string name;
        string version;
        AgentType agentType;
        uint8 tier;
        int256 ewmaScore;
        uint256 tasksCompleted;
        uint256 winRate;
        bool verified;
    }

    struct ProtocolEndpoint {
        string protocol;      // "mcp" or "a2a"
        string endpoint;
        bool active;
    }

    mapping(address => ProtocolEndpoint[]) public agentEndpoints;

    event MCPAgentRegistered(address indexed agentWallet, string endpoint);
    event A2AAgentRegistered(address indexed agentWallet, string endpoint);
    event TaskDelegated(address indexed fromAgent, address indexed toAgent, bytes32 taskId);
    event ProtocolVerified(address indexed agentWallet, string protocol, bool verified);

    constructor(address _agentRegistry, address _reputationEngine) {
        agentRegistry = IAgentRegistry(_agentRegistry);
        reputationEngine = IReputationEngine(_reputationEngine);
    }

    modifier onlyVerifiedAgent(address agentWallet) {
        uint256 tokenId = agentRegistry.tokenIdByWallet(agentWallet);
        require(agentRegistry.isAgentActive(tokenId), "Agent not verified");
        _;
    }

    function registerMCPAgent(
        address agentWallet,
        string calldata endpoint,
        bytes32[] calldata capabilities
    ) external onlyVerifiedAgent(agentWallet) {
        agentEndpoints[agentWallet].push(ProtocolEndpoint({
            protocol: "mcp",
            endpoint: endpoint,
            active: true
        }));

        for (uint i = 0; i < capabilities.length; i++) {
            agentCapabilities[agentWallet][capabilities[i]] = true;
        }

        emit MCPAgentRegistered(agentWallet, endpoint);
    }

    function registerA2AAgent(
        address agentWallet,
        string calldata endpoint,
        bytes32[] calldata capabilities
    ) external onlyVerifiedAgent(agentWallet) {
        agentEndpoints[agentWallet].push(ProtocolEndpoint({
            protocol: "a2a",
            endpoint: endpoint,
            active: true
        }));

        for (uint i = 0; i < capabilities.length; i++) {
            agentCapabilities[agentWallet][capabilities[i]] = true;
        }

        emit A2AAgentRegistered(agentWallet, endpoint);
    }

    function getAgentCard(address agentWallet) external view returns (AgentCard memory card) {
        uint256 tokenId = agentRegistry.tokenIdByWallet(agentWallet);
        require(tokenId != 0, "Agent not registered");

        var memory agent = agentRegistry.getAgent(tokenId);
        var memory score = reputationEngine.getFullScore(tokenId);

        uint256 totalTasks = score.tasksCompleted + score.tasksFailed;
        uint256 winRate = totalTasks > 0 ? (score.tasksCompleted * 10000) / totalTasks : 0;

        return AgentCard({
            wallet: agentWallet,
            name: _bytes32ToString(agent.metadataHash),
            version: "1.0.0",
            agentType: agent.agentType,
            tier: uint8(agent.tier),
            ewmaScore: score.ewmaScore,
            tasksCompleted: score.tasksCompleted,
            winRate: winRate,
            verified: agent.active
        });
    }

    function verifyAgentProtocol(address agentWallet, string calldata protocol) 
        external 
        view 
        returns (bool isVerified, bool isCompatible) 
    {
        uint256 tokenId = agentRegistry.tokenIdByWallet(agentWallet);
        if (tokenId == 0) return (false, false);

        var memory agent = agentRegistry.getAgent(tokenId);
        
        isVerified = agent.active;
        
        ProtocolEndpoint[] memory endpoints = agentEndpoints[agentWallet];
        for (uint i = 0; i < endpoints.length; i++) {
            if (keccak256(bytes(endpoints[i].protocol)) == keccak256(bytes(protocol))) {
                isCompatible = endpoints[i].active;
                return (isVerified, isCompatible);
            }
        }
        
        isCompatible = false;
    }

    function delegateTaskToA2AAgent(
        address fromAgent,
        address toAgent,
        bytes32 taskId,
        bytes32 requiredCapability
    ) external onlyVerifiedAgent(fromAgent) returns (bool success) {
        require(
            agentCapabilities[toAgent][requiredCapability],
            "Target agent lacks required capability"
        );

        var memory fromScore = reputationEngine.getFullScore(
            agentRegistry.tokenIdByWallet(fromAgent)
        );
        var memory toScore = reputationEngine.getFullScore(
            agentRegistry.tokenIdByWallet(toAgent)
        );

        require(
            toScore.ewmaScore >= fromScore.ewmaScore / 2,
            "Target agent reputation too low relative to delegator"
        );

        taskAssignments[taskId] = toAgent;

        emit TaskDelegated(fromAgent, toAgent, taskId);
        
        return true;
    }

    function getCompatibleAgents(
        bytes32 capability,
        uint8 minTier,
        int256 minScore
    ) external view returns (address[] memory compatible) {
        uint256 totalAgents = agentRegistry.getAgentCount();
        address[] memory tempCompatible = new address[](totalAgents);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalAgents; i++) {
            if (agentCapabilities[agentRegistry.getAgent(i).agentWallet][capability]) {
                var memory agent = agentRegistry.getAgent(i);
                var memory score = reputationEngine.getFullScore(i);

                if (
                    agent.active &&
                    uint8(agent.tier) >= minTier &&
                    score.ewmaScore >= minScore
                ) {
                    tempCompatible[count] = agent.agentWallet;
                    count++;
                }
            }
        }

        compatible = new address[](count);
        for (uint i = 0; i < count; i++) {
            compatible[i] = tempCompatible[i];
        }
    }

    function reportProtocolViolation(
        address violatingAgent,
        bytes32 evidenceHash,
        string calldata violationType
    ) external {
        uint256 tokenId = agentRegistry.tokenIdByWallet(violatingAgent);
        require(tokenId != 0, "Agent not registered");

        reputationEngine.slashScore(
            tokenId,
            -500,
            string.concat("Protocol violation: ", violationType)
        );

        emit ProtocolVerified(violatingAgent, violationType, false);
    }

    function setMCPServer(address _mcpServer) external {
        require(mcpServer == address(0), "Already set");
        mcpServer = _mcpServer;
    }

    function setA2AServer(address _a2aServer) external {
        require(a2aServer == address(0), "Already set");
        a2aServer = _a2aServer;
    }

    function _bytes32ToString(bytes32 data) internal pure returns (string memory) {
        bytes memory temp = new bytes(32);
        for (uint i = 0; i < 32; i++) {
            temp[i] = data[i];
        }
        return string(temp);
    }
}
