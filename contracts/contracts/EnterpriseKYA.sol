// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IAgentRegistry } from "./interfaces/IAgentRegistry.sol";
import { IReputationEngine } from "./interfaces/IReputationEngine.sol";

contract EnterpriseKYA {
    IAgentRegistry public agentRegistry;
    IReputationEngine public reputationEngine;

    enum TierLevel {
        FREE,
        STARTER,
        PROFESSIONAL,
        ENTERPRISE,
        UNLIMITED
    }

    struct TierConfig {
        string name;
        uint256 monthlyRateUsdc;
        uint256 requestsPerMinute;
        uint256 requestsPerDay;
        uint256 batchSizeLimit;
        uint256 rateLimitWindow;
        bool hasSla;
        uint256 slaUptimeBps;
        uint256 maxLatencyMs;
        bool hasDedicatedSupport;
        uint256 supportResponseHours;
        bool hasCustomWebhooks;
        bool hasAdvancedAnalytics;
        bool hasPriorityProcessing;
    }

    struct EnterpriseClient {
        address wallet;
        TierLevel tier;
        uint256 apiKeyIndex;
        uint256 monthlyLimit;
        uint256 usedThisMonth;
        uint256 requestsToday;
        uint256 requestsThisMinute;
        uint256 lastRequestMinute;
        uint256 contractStart;
        uint256 nextBilling;
        bool active;
        string companyName;
    }

    struct APIKey {
        bytes32 keyHash;
        address owner;
        TierLevel tier;
        uint256 permissions;
        uint256 createdAt;
        uint256 lastUsedAt;
        uint256 usageCount;
        bool active;
    }

    struct UsageRecord {
        address client;
        uint256 timestamp;
        uint256 gasUsed;
        bytes32 endpoint;
    }

    mapping(address => EnterpriseClient) public clients;
    mapping(bytes32 => APIKey) public apiKeys;
    mapping(address => bytes32[]) public clientApiKeys;
    mapping(bytes32 => UsageRecord[]) public endpointUsage;
    
    bytes32[] public allApiKeys;

    TierConfig public freeTier;
    TierConfig public starterTier;
    TierConfig public professionalTier;
    TierConfig public enterpriseTier;
    TierConfig public unlimitedTier;

    uint256 public constant MINIMUM_CONTRACT_DURATION = 30 days;

    event ClientSubscribed(address indexed client, TierLevel tier, uint256 startTime);
    event ClientUpgraded(address indexed client, TierLevel oldTier, TierLevel newTier);
    event ClientCancelled(address indexed client);
    event APIKeyCreated(address indexed owner, bytes32 keyHash, TierLevel tier);
    event APIKeyRevoked(bytes32 indexed keyHash);
    event APIKeyUsed(bytes32 indexed keyHash, address client);
    event TierConfigUpdated(TierLevel tier, TierConfig config);

    modifier onlyActiveClient(address client) {
        require(clients[client].active, "Client not active");
        _;
    }

    modifier onlyValidAPIKey(bytes32 keyHash) {
        require(apiKeys[keyHash].active, "Invalid API key");
        _;
    }

    constructor(address _agentRegistry, address _reputationEngine) {
        agentRegistry = IAgentRegistry(_agentRegistry);
        reputationEngine = IReputationEngine(_reputationEngine);

        _initializeTierConfigs();
    }

    function _initializeTierConfigs() internal {
        freeTier = TierConfig({
            name: "Free",
            monthlyRateUsdc: 0,
            requestsPerMinute: 10,
            requestsPerDay: 1000,
            batchSizeLimit: 5,
            rateLimitWindow: 60,
            hasSla: false,
            slaUptimeBps: 0,
            maxLatencyMs: 0,
            hasDedicatedSupport: false,
            supportResponseHours: 0,
            hasCustomWebhooks: false,
            hasAdvancedAnalytics: false,
            hasPriorityProcessing: false
        });

        starterTier = TierConfig({
            name: "Starter",
            monthlyRateUsdc: 99000000,
            requestsPerMinute: 60,
            requestsPerDay: 10000,
            batchSizeLimit: 25,
            rateLimitWindow: 60,
            hasSla: true,
            slaUptimeBps: 9950,
            maxLatencyMs: 500,
            hasDedicatedSupport: false,
            supportResponseHours: 48,
            hasCustomWebhooks: false,
            hasAdvancedAnalytics: false,
            hasPriorityProcessing: false
        });

        professionalTier = TierConfig({
            name: "Professional",
            monthlyRateUsdc: 499000000,
            requestsPerMinute: 300,
            requestsPerDay: 100000,
            batchSizeLimit: 100,
            rateLimitWindow: 60,
            hasSla: true,
            slaUptimeBps: 9990,
            maxLatencyMs: 300,
            hasDedicatedSupport: true,
            supportResponseHours: 24,
            hasCustomWebhooks: true,
            hasAdvancedAnalytics: true,
            hasPriorityProcessing: false
        });

        enterpriseTier = TierConfig({
            name: "Enterprise",
            monthlyRateUsdc: 1999000000,
            requestsPerMinute: 1000,
            requestsPerDay: 1000000,
            batchSizeLimit: 500,
            rateLimitWindow: 60,
            hasSla: true,
            slaUptimeBps: 9995,
            maxLatencyMs: 200,
            hasDedicatedSupport: true,
            supportResponseHours: 4,
            hasCustomWebhooks: true,
            hasAdvancedAnalytics: true,
            hasPriorityProcessing: true
        });

        unlimitedTier = TierConfig({
            name: "Unlimited",
            monthlyRateUsdc: 9999000000,
            requestsPerMinute: 10000,
            requestsPerDay: type(uint256).max,
            batchSizeLimit: 1000,
            rateLimitWindow: 60,
            hasSla: true,
            slaUptimeBps: 9999,
            maxLatencyMs: 100,
            hasDedicatedSupport: true,
            supportResponseHours: 1,
            hasCustomWebhooks: true,
            hasAdvancedAnalytics: true,
            hasPriorityProcessing: true
        });
    }

    function subscribe(TierLevel tier, string calldata companyName) external {
        require(uint8(tier) > 0, "Use free tier");
        
        TierConfig memory config = _getTierConfig(tier);
        
        EnterpriseClient storage client = clients[msg.sender];
        require(!client.active || client.tier != tier, "Already subscribed to this tier");

        uint256 oldTier = uint256(client.tier);
        
        client.wallet = msg.sender;
        client.tier = tier;
        client.contractStart = block.timestamp;
        client.nextBilling = block.timestamp + 30 days;
        client.active = true;
        client.companyName = companyName;
        client.usedThisMonth = 0;
        client.requestsToday = 0;
        client.requestsThisMinute = 0;

        if (oldTier > 0) {
            emit ClientUpgraded(msg.sender, TierLevel(oldTier), tier);
        } else {
            emit ClientSubscribed(msg.sender, tier, block.timestamp);
        }
    }

    function cancelSubscription() external onlyActiveClient(msg.sender) {
        clients[msg.sender].active = false;
        emit ClientCancelled(msg.sender);
    }

    function createAPIKey(TierLevel tier) external returns (bytes32 keyHash) {
        require(uint8(tier) > 0, "Cannot create key for free tier");
        require(clients[msg.sender].active, "Must be subscribed");
        require(clients[msg.sender].tier >= tier, "Tier not available");

        bytes32 entropy = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            clients[msg.sender].apiKeyIndex
        ));
        
        keyHash = keccak256(abi.encodePacked(entropy));

        apiKeys[keyHash] = APIKey({
            keyHash: keyHash,
            owner: msg.sender,
            tier: tier,
            permissions: 0xFF,
            createdAt: block.timestamp,
            lastUsedAt: 0,
            usageCount: 0,
            active: true
        });

        clientApiKeys[msg.sender].push(keyHash);
        allApiKeys.push(keyHash);
        clients[msg.sender].apiKeyIndex++;

        emit APIKeyCreated(msg.sender, keyHash, tier);

        return keyHash;
    }

    function revokeAPIKey(bytes32 keyHash) external {
        require(apiKeys[keyHash].owner == msg.sender, "Not owner");
        require(apiKeys[keyHash].active, "Already revoked");

        apiKeys[keyHash].active = false;
        emit APIKeyRevoked(keyHash);
    }

    function validateAndRecordUsage(bytes32 keyHash) external onlyValidAPIKey(keyHash) returns (bool allowed) {
        APIKey storage key = apiKeys[keyHash];
        EnterpriseClient storage client = clients[key.owner];
        
        require(client.active, "Client not active");
        
        TierConfig memory config = _getTierConfig(client.tier);
        
        if (client.lastRequestMinute != block.timestamp / config.rateLimitWindow) {
            client.requestsThisMinute = 0;
            client.lastRequestMinute = block.timestamp / config.rateLimitWindow;
        }
        
        require(client.requestsThisMinute < config.requestsPerMinute, "Rate limit exceeded");
        require(client.usedThisMonth < client.monthlyLimit || client.monthlyLimit == 0, "Monthly limit exceeded");
        
        client.requestsThisMinute++;
        client.usedThisMonth++;
        client.requestsToday++;
        key.lastUsedAt = block.timestamp;
        key.usageCount++;
        
        emit APIKeyUsed(keyHash, key.owner);
        
        return true;
    }

    function verifyAgent(bytes32 keyHash, address agentWallet) 
        external 
        onlyValidAPIKey(keyHash) 
        returns (
            bool isVerified,
            int256 score,
            uint8 tier,
            uint256 tokenId
        ) 
    {
        require(validateAndRecordUsage(keyHash), "Usage not allowed");

        tokenId = agentRegistry.tokenIdByWallet(agentWallet);
        if (tokenId == 0) {
            return (false, 0, 0, 0);
        }

        isVerified = agentRegistry.isAgentActive(tokenId);
        var memory scoreData = reputationEngine.getFullScore(tokenId);
        
        score = scoreData.ewmaScore;
        tier = uint8(scoreData.tier);
    }

    function getAgentProfile(bytes32 keyHash, address agentWallet)
        external
        onlyValidAPIKey(keyHash)
        returns (bool exists, bytes memory profileData)
    {
        require(validateAndRecordUsage(keyHash), "Usage not allowed");
        
        return (true, abi.encode(agentRegistry.getAgent(
            agentRegistry.tokenIdByWallet(agentWallet)
        )));
    }

    function batchVerifyAgents(bytes32 keyHash, address[] calldata agentWallets)
        external
        onlyValidAPIKey(keyHash)
        returns (uint256[] memory results)
    {
        require(validateAndRecordUsage(keyHash), "Usage not allowed");
        
        APIKey storage key = apiKeys[keyHash];
        TierConfig memory config = _getTierConfig(key.tier);
        
        require(agentWallets.length <= config.batchSizeLimit, "Batch size exceeded");
        
        results = new uint256[](agentWallets.length);
        
        for (uint i = 0; i < agentWallets.length; i++) {
            uint256 tokenId = agentRegistry.tokenIdByWallet(agentWallets[i]);
            if (tokenId > 0 && agentRegistry.isAgentActive(tokenId)) {
                results[i] = 1;
            }
        }
    }

    function getTierConfig(TierLevel tier) external view returns (TierConfig memory) {
        return _getTierConfig(tier);
    }

    function _getTierConfig(TierLevel tier) internal view returns (TierConfig memory) {
        if (tier == TierLevel.FREE) return freeTier;
        if (tier == TierLevel.STARTER) return starterTier;
        if (tier == TierLevel.PROFESSIONAL) return professionalTier;
        if (tier == TierLevel.ENTERPRISE) return enterpriseTier;
        return unlimitedTier;
    }

    function getClientInfo(address client) external view returns (EnterpriseClient memory) {
        return clients[client];
    }

    function getAPIKeyInfo(bytes32 keyHash) external view returns (APIKey memory) {
        return apiKeys[keyHash];
    }

    function getUsageStats(bytes32 keyHash) external view returns (
        uint256 totalUsage,
        uint256 usageToday,
        uint256 usageThisMinute,
        uint256 lastUsed
    ) {
        APIKey memory key = apiKeys[keyHash];
        EnterpriseClient memory client = clients[key.owner];
        
        return (
            key.usageCount,
            client.requestsToday,
            client.requestsThisMinute,
            key.lastUsedAt
        );
    }

    function updateTierConfig(TierLevel tier, TierConfig calldata config) external {
        if (tier == TierLevel.FREE) freeTier = config;
        else if (tier == TierLevel.STARTER) starterTier = config;
        else if (tier == TierLevel.PROFESSIONAL) professionalTier = config;
        else if (tier == TierLevel.ENTERPRISE) enterpriseTier = config;
        else unlimitedTier = config;
        
        emit TierConfigUpdated(tier, config);
    }

    function getAllTiers() external view returns (TierConfig[] memory) {
        TierConfig[] memory tiers = new TierConfig[](5);
        tiers[0] = freeTier;
        tiers[1] = starterTier;
        tiers[2] = professionalTier;
        tiers[3] = enterpriseTier;
        tiers[4] = unlimitedTier;
        return tiers;
    }

    function getSLACompliance(address client) external view returns (
        bool compliant,
        uint256 uptimeBps,
        uint256 maxLatencyMs,
        uint256 responseTimeHours
    ) {
        EnterpriseClient memory c = clients[client];
        TierConfig memory config = _getTierConfig(c.tier);
        
        return (
            config.hasSla,
            config.slaUptimeBps,
            config.maxLatencyMs,
            config.supportResponseHours
        );
    }
}
