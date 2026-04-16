// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IAgentRegistry } from "./interfaces/IAgentRegistry.sol";
import { IReputationEngine } from "./interfaces/IReputationEngine.sol";

interface IBridgeReceiver {
    function receiveReputation(
        address agentWallet,
        int256 rawScore,
        int256 ewmaScore,
        uint8 tier,
        bytes32 proofHash
    ) external;
}

contract CrossChainBridge {
    IAgentRegistry public agentRegistry;
    IReputationEngine public reputationEngine;

    uint256 public constant CANONICAL_CHAIN_ID = 8453;

    struct BridgeRecord {
        address agentWallet;
        uint256 targetChain;
        int256 scoreAtBridge;
        uint8 tierAtBridge;
        uint256 bridgedAt;
        uint256 lastSyncedAt;
        uint256 syncCount;
        bool active;
        bytes32 latestProofHash;
    }

    struct SyncRequest {
        address agentWallet;
        uint256 targetChain;
        int256 newScore;
        uint256 requestBlock;
        bool processed;
    }

    mapping(address => mapping(uint256 => BridgeRecord)) public bridgeRecords;
    mapping(bytes32 => bool) public processedMessages;

    mapping(address => uint256[]) public agentBridgeChains;
    mapping(uint256 => address[]) public chainAgents;

    uint256 public nextSyncRequestId = 1;
    mapping(uint256 => SyncRequest) public syncRequests;

    event ReputationBridged(
        address indexed agentWallet,
        uint256 indexed targetChain,
        int256 score,
        uint8 tier,
        bytes32 proofHash
    );

    event ReputationSynced(
        address indexed agentWallet,
        uint256 indexed targetChain,
        int256 oldScore,
        int256 newScore
    );

    event BridgeDeactivated(
        address indexed agentWallet,
        uint256 indexed targetChain
    );

    event SyncRequested(
        uint256 indexed requestId,
        address indexed agentWallet,
        uint256 indexed targetChain,
        int256 newScore
    );

    modifier onlyVerifiedAgent(address agentWallet) {
        uint256 tokenId = agentRegistry.tokenIdByWallet(agentWallet);
        require(agentRegistry.isAgentActive(tokenId), "Agent not verified");
        _;
    }

    constructor(address _agentRegistry, address _reputationEngine) {
        agentRegistry = IAgentRegistry(_agentRegistry);
        reputationEngine = IReputationEngine(_reputationEngine);
    }

    function bridgeReputation(
        uint256 targetChain,
        bytes32 proofHash
    ) external onlyVerifiedAgent(msg.sender) returns (bool success) {
        require(targetChain != CANONICAL_CHAIN_ID, "Cannot bridge to canonical chain");
        require(
            targetChain == 10 || targetChain == 42161 || targetChain == 137,
            "Unsupported chain"
        );

        uint256 tokenId = agentRegistry.tokenIdByWallet(msg.sender);
        var memory score = reputationEngine.getFullScore(tokenId);

        BridgeRecord storage record = bridgeRecords[msg.sender][targetChain];
        
        if (!record.active) {
            agentBridgeChains[msg.sender].push(targetChain);
            chainAgents[targetChain].push(msg.sender);
        }

        record.agentWallet = msg.sender;
        record.targetChain = targetChain;
        record.scoreAtBridge = score.ewmaScore;
        record.tierAtBridge = uint8(score.tier);
        record.bridgedAt = block.timestamp;
        record.lastSyncedAt = block.timestamp;
        record.syncCount = 0;
        record.active = true;
        record.latestProofHash = proofHash;

        emit ReputationBridged(
            msg.sender,
            targetChain,
            score.ewmaScore,
            uint8(score.tier),
            proofHash
        );

        return true;
    }

    function requestSync(
        uint256 targetChain,
        int256 newScore
    ) external onlyVerifiedAgent(msg.sender) returns (uint256 requestId) {
        require(bridgeRecords[msg.sender][targetChain].active, "Bridge not active");

        requestId = nextSyncRequestId++;

        syncRequests[requestId] = SyncRequest({
            agentWallet: msg.sender,
            targetChain: targetChain,
            newScore: newScore,
            requestBlock: block.number,
            processed: false
        });

        emit SyncRequested(requestId, msg.sender, targetChain, newScore);

        return requestId;
    }

    function processSync(
        uint256 requestId,
        bytes32 proofHash
    ) external returns (bool success) {
        SyncRequest storage request = syncRequests[requestId];
        require(!request.processed, "Already processed");
        require(request.agentWallet != address(0), "Invalid request");

        BridgeRecord storage record = bridgeRecords[request.agentWallet][request.targetChain];
        require(record.active, "Bridge not active");

        int256 oldScore = record.scoreAtBridge;
        record.scoreAtBridge = request.newScore;
        record.lastSyncedAt = block.timestamp;
        record.syncCount++;
        record.latestProofHash = proofHash;

        request.processed = true;

        emit ReputationSynced(
            request.agentWallet,
            request.targetChain,
            oldScore,
            request.newScore
        );

        return true;
    }

    function deactivateBridge(uint256 targetChain) external {
        BridgeRecord storage record = bridgeRecords[msg.sender][targetChain];
        require(record.active, "Bridge not active");

        record.active = false;

        emit BridgeDeactivated(msg.sender, targetChain);
    }

    function getBridgeRecord(
        address agentWallet,
        uint256 targetChain
    ) external view returns (BridgeRecord memory) {
        return bridgeRecords[agentWallet][targetChain];
    }

    function getAgentBridges(
        address agentWallet
    ) external view returns (BridgeRecord[] memory) {
        uint256[] storage chains = agentBridgeChains[agentWallet];
        BridgeRecord[] memory records = new BridgeRecord[](chains.length);

        for (uint i = 0; i < chains.length; i++) {
            records[i] = bridgeRecords[agentWallet][chains[i]];
        }

        return records;
    }

    function getChainAgents(
        uint256 targetChain
    ) external view returns (address[] memory) {
        return chainAgents[targetChain];
    }

    function verifyProof(
        address agentWallet,
        int256 claimedScore,
        bytes32 proofHash
    ) external view returns (bool valid) {
        uint256 tokenId = agentRegistry.tokenIdByWallet(agentWallet);
        if (tokenId == 0) return false;

        var memory score = reputationEngine.getFullScore(tokenId);
        
        if (score.ewmaScore != claimedScore) return false;

        return true;
    }

    function getBridgeStats() external view returns (
        uint256 totalBridges,
        uint256 activeBridges,
        uint256 totalSyncs,
        uint256 chain0Count,
        uint256 chain1Count,
        uint256 chain2Count
    ) {
        totalBridges = 0;
        activeBridges = 0;
        totalSyncs = 0;

        for (uint i = 0; i < agentBridgeChains[msg.sender].length; i++) {
            address agent = msg.sender;
            uint256 chain = agentBridgeChains[agent][i];
            BridgeRecord storage record = bridgeRecords[agent][chain];
            
            totalBridges++;
            if (record.active) activeBridges++;
            totalSyncs += record.syncCount;
        }

        chain0Count = chainAgents[10].length;
        chain1Count = chainAgents[42161].length;
        chain2Count = chainAgents[137].length;
    }

    function receiveCrossChainMessage(
        bytes32 sourceChain,
        address agentWallet,
        int256 rawScore,
        int256 ewmaScore,
        uint8 tier,
        bytes32 proofHash
    ) external {
        bytes32 messageHash = keccak256(abi.encodePacked(
            sourceChain,
            agentWallet,
            rawScore,
            ewmaScore,
            tier,
            block.number
        ));

        require(!processedMessages[messageHash], "Message already processed");
        processedMessages[messageHash] = true;

        BridgeRecord storage record = bridgeRecords[agentWallet][uint256(sourceChain)];
        
        if (!record.active) {
            record.agentWallet = agentWallet;
            record.targetChain = uint256(sourceChain);
            record.bridgedAt = block.timestamp;
            record.active = true;
            
            agentBridgeChains[agentWallet].push(uint256(sourceChain));
            chainAgents[uint256(sourceChain)].push(agentWallet);
        }

        record.scoreAtBridge = ewmaScore;
        record.tierAtBridge = tier;
        record.lastSyncedAt = block.timestamp;
        record.syncCount++;
        record.latestProofHash = proofHash;

        emit ReputationSynced(agentWallet, uint256(sourceChain), record.scoreAtBridge, ewmaScore);
    }
}
