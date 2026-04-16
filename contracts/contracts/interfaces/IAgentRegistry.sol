// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum AgentType {
    LLM_BASED,
    RULE_BASED,
    HYBRID
}

enum Tier {
    UNRANKED,
    BRONZE,
    SILVER,
    GOLD,
    PLATINUM
}

struct Agent {
    uint256 tokenId;
    address operator;
    address agentWallet;
    AgentType agentType;
    uint8 subType;
    bytes32 metadataHash;
    bytes32 capabilitiesHash;
    Tier tier;
    uint64 registeredAt;
    bool active;
}

struct FleetInfo {
    uint256 maxSubAgents;
    uint256 currentSubAgentCount;
    bool subTaskingEnabled;
    uint256 delegationDepth;
    bool autoOptimization;
}

interface IAgentRegistry {
    event AgentRegistered(
        uint256 indexed tokenId,
        address indexed operator,
        address indexed agentWallet,
        AgentType agentType,
        uint64 registeredAt
    );

    event AgentTypeUpdated(
        uint256 indexed tokenId,
        AgentType oldType,
        AgentType newType
    );

    event TierUpgraded(
        uint256 indexed tokenId,
        Tier oldTier,
        Tier newTier
    );

    event AgentDeactivated(
        uint256 indexed tokenId,
        address indexed by,
        string reason
    );

    event MetadataUpdated(
        uint256 indexed tokenId,
        bytes32 newMetadataHash
    );

    event FleetConfigured(
        uint256 indexed tokenId,
        FleetInfo fleetInfo
    );

    event SubAgentWhitelisted(
        uint256 indexed parentTokenId,
        address subAgentWallet
    );

    event SubAgentRemoved(
        uint256 indexed parentTokenId,
        address subAgentWallet
    );

    error AlreadyRegistered(address agentWallet);
    error NotTransferable();
    error InsufficientStake(uint256 required, uint256 provided);
    error Unauthorized(address caller);
    error AgentNotActive(uint256 tokenId);
    error InvalidTier(Tier tier);
    error InvalidAgentType(AgentType agentType);
    error FleetSizeExceeded(uint256 max, uint256 actual);
    error SubAgentNotWhitelisted(address subAgent);
    error InvalidDelegationDepth(uint256 maxDepth);
    error SelfDelegationNotAllowed();

    function registerAgent(
        address agentWallet,
        AgentType agentType,
        uint8 subType,
        bytes32 metadataHash,
        bytes32 capabilitiesHash,
        Tier initialTier
    ) external returns (uint256 tokenId);

    function updateAgentType(
        uint256 tokenId,
        AgentType newType,
        uint8 newSubType,
        bytes32 newCapabilitiesHash
    ) external;

    function upgradeTier(uint256 tokenId, Tier targetTier) external;

    function updateMetadata(uint256 tokenId, bytes32 newMetadataHash) external;

    function deactivateAgent(uint256 tokenId, string calldata reason) external;

    function reactivateAgent(uint256 tokenId) external;

    function configureFleet(uint256 tokenId, FleetInfo calldata fleetConfig) external;

    function addSubAgent(uint256 tokenId, address subAgentWallet) external;

    function removeSubAgent(uint256 tokenId, address subAgentWallet) external;

    function isSubAgentWhitelisted(uint256 tokenId, address subAgentWallet) external view returns (bool);

    function getAgent(uint256 tokenId) external view returns (Agent memory);

    function getAgentByWallet(address agentWallet) external view returns (Agent memory);

    function tokenIdByWallet(address agentWallet) external view returns (uint256);

    function getFleetInfo(uint256 tokenId) external view returns (FleetInfo memory);

    function getAgentCount() external view returns (uint256);

    function isAgentActive(uint256 tokenId) external view returns (bool);

    function getAgentsByOperator(address operator) external view returns (uint256[] memory);

    function verifyCapabilities(uint256 tokenId, bytes32[] calldata requiredCapabilities) external view returns (bool);
}
