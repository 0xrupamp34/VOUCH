// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import { IAgentRegistry } from "../interfaces/IAgentRegistry.sol";

contract AgentRegistry is IAgentRegistry, ERC721, ERC721Enumerable, ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    mapping(uint256 => Agent) private _agents;
    mapping(address => uint256) private _walletToTokenId;
    mapping(uint256 => FleetInfo) private _fleetInfo;
    mapping(uint256 => mapping(address => bool)) private _subAgentWhitelists;
    mapping(address => uint256[]) private _operatorAgents;
    mapping(bytes32 => bool) private _capabilitiesCache;

    uint256 public constant TIER_STAKE_REQUIREMENTS = 100e18;
    uint256 public constant MIN_STAKE_BRIDGE = TIER_STAKE_REQUIREMENTS;

    address public reputationEngine;
    address public vouchToken;

    modifier onlyActiveAgent(uint256 tokenId) {
        if (!_agents[tokenId].active) revert AgentNotActive(tokenId);
        _;
    }

    modifier onlyAgentOperator(uint256 tokenId) {
        if (msg.sender != _agents[tokenId].operator) revert Unauthorized(msg.sender);
        _;
    }

    constructor(
        address _reputationEngine,
        address _vouchToken
    ) ERC721("VOUCH Agent", "VAGENT") {
        reputationEngine = _reputationEngine;
        vouchToken = _vouchToken;
    }

    function registerAgent(
        address agentWallet,
        AgentType agentType,
        uint8 subType,
        bytes32 metadataHash,
        bytes32 capabilitiesHash,
        Tier initialTier
    ) external returns (uint256 tokenId) {
        if (agentWallet == address(0)) revert ZeroAddress();
        if (_walletToTokenId[agentWallet] != 0) revert AlreadyRegistered(agentWallet);
        if (initialTier > Tier.PLATINUM) revert InvalidTier(initialTier);

        if (initialTier >= Tier.BRONZE) {
            uint256 stakeRequired = getStakeRequirement(initialTier);
            _validateAndStake(stakeRequired);
        }

        tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, tokenId);

        Agent storage agent = _agents[tokenId];
        agent.tokenId = tokenId;
        agent.operator = msg.sender;
        agent.agentWallet = agentWallet;
        agent.agentType = agentType;
        agent.subType = subType;
        agent.metadataHash = metadataHash;
        agent.capabilitiesHash = capabilitiesHash;
        agent.tier = initialTier;
        agent.registeredAt = uint64(block.timestamp);
        agent.active = true;

        _walletToTokenId[agentWallet] = tokenId;
        _operatorAgents[msg.sender].push(tokenId);

        FleetInfo storage fleet = _fleetInfo[tokenId];
        fleet.maxSubAgents = _getMaxFleetSize(initialTier);
        fleet.delegationDepth = _getMaxDelegationDepth(initialTier);

        if (reputationEngine != address(0)) {
            IReputationEngine(reputationEngine).initializeScore(tokenId);
        }

        emit AgentRegistered(
            tokenId,
            msg.sender,
            agentWallet,
            agentType,
            agent.registeredAt
        );

        if (initialTier != Tier.UNRANKED) {
            emit TierUpgraded(tokenId, Tier.UNRANKED, initialTier);
        }

        emit FleetConfigured(tokenId, fleet);
    }

    function updateAgentType(
        uint256 tokenId,
        AgentType newType,
        uint8 newSubType,
        bytes32 newCapabilitiesHash
    ) external onlyAgentOperator(tokenId) onlyActiveAgent(tokenId) {
        Agent storage agent = _agents[tokenId];
        AgentType oldType = agent.agentType;
        agent.agentType = newType;
        agent.subType = newSubType;
        agent.capabilitiesHash = newCapabilitiesHash;

        emit AgentTypeUpdated(tokenId, oldType, newType);
    }

    function upgradeTier(uint256 tokenId, Tier targetTier) 
        external 
        onlyAgentOperator(tokenId) 
        onlyActiveAgent(tokenId) 
    {
        Agent storage agent = _agents[tokenId];
        Tier currentTier = agent.tier;

        if (targetTier <= currentTier) revert InvalidTier(targetTier);
        if (targetTier > Tier.PLATINUM) revert InvalidTier(targetTier);

        uint256 additionalStake = getStakeRequirement(targetTier) - getStakeRequirement(currentTier);
        if (additionalStake > 0) {
            _validateAndStake(additionalStake);
        }

        agent.tier = targetTier;
        _fleetInfo[tokenId].maxSubAgents = _getMaxFleetSize(targetTier);
        _fleetInfo[tokenId].delegationDepth = _getMaxDelegationDepth(targetTier);

        emit TierUpgraded(tokenId, currentTier, targetTier);
        emit FleetConfigured(tokenId, _fleetInfo[tokenId]);
    }

    function updateMetadata(uint256 tokenId, bytes32 newMetadataHash) 
        external 
        onlyAgentOperator(tokenId) 
        onlyActiveAgent(tokenId) 
    {
        _agents[tokenId].metadataHash = newMetadataHash;
        emit MetadataUpdated(tokenId, newMetadataHash);
    }

    function deactivateAgent(uint256 tokenId, string calldata reason) 
        external 
        onlyAgentOperator(tokenId) 
    {
        Agent storage agent = _agents[tokenId];
        agent.active = false;

        emit AgentDeactivated(tokenId, msg.sender, reason);
    }

    function reactivateAgent(uint256 tokenId) 
        external 
        onlyAgentOperator(tokenId) 
    {
        Agent storage agent = _agents[tokenId];
        if (agent.tier >= Tier.BRONZE) {
            uint256 stakeRequired = getStakeRequirement(agent.tier);
            _validateAndStake(stakeRequired);
        }
        agent.active = true;

        emit AgentRegistered(
            tokenId,
            agent.operator,
            agent.agentWallet,
            agent.agentType,
            uint64(block.timestamp)
        );
    }

    function configureFleet(uint256 tokenId, FleetInfo calldata fleetConfig) 
        external 
        onlyAgentOperator(tokenId) 
        onlyActiveAgent(tokenId) 
    {
        FleetInfo storage fleet = _fleetInfo[tokenId];
        
        if (fleetConfig.maxSubAgents > _getMaxFleetSize(_agents[tokenId].tier)) {
            revert FleetSizeExceeded(_getMaxFleetSize(_agents[tokenId].tier), fleetConfig.maxSubAgents);
        }
        
        if (fleetConfig.delegationDepth > _getMaxDelegationDepth(_agents[tokenId].tier)) {
            revert InvalidDelegationDepth(_getMaxDelegationDepth(_agents[tokenId].tier));
        }

        fleet.maxSubAgents = fleetConfig.maxSubAgents;
        fleet.subTaskingEnabled = fleetConfig.subTaskingEnabled;
        fleet.delegationDepth = fleetConfig.delegationDepth;
        fleet.autoOptimization = fleetConfig.autoOptimization;

        emit FleetConfigured(tokenId, fleet);
    }

    function addSubAgent(uint256 tokenId, address subAgentWallet) 
        external 
        onlyAgentOperator(tokenId) 
        onlyActiveAgent(tokenId) 
    {
        if (subAgentWallet == address(0)) revert ZeroAddress();
        if (subAgentWallet == msg.sender) revert SelfDelegationNotAllowed();

        FleetInfo storage fleet = _fleetInfo[tokenId];
        if (fleet.currentSubAgentCount >= fleet.maxSubAgents) {
            revert FleetSizeExceeded(fleet.maxSubAgents, fleet.currentSubAgentCount + 1);
        }

        uint256 subAgentTokenId = _walletToTokenId[subAgentWallet];
        if (subAgentTokenId == 0) revert AgentNotActive(0);

        _subAgentWhitelists[tokenId][subAgentWallet] = true;
        fleet.currentSubAgentCount++;

        emit SubAgentWhitelisted(tokenId, subAgentWallet);
    }

    function removeSubAgent(uint256 tokenId, address subAgentWallet) 
        external 
        onlyAgentOperator(tokenId) 
    {
        if (!_subAgentWhitelists[tokenId][subAgentWallet]) {
            revert SubAgentNotWhitelisted(subAgentWallet);
        }

        _subAgentWhitelists[tokenId][subAgentWallet] = false;
        _fleetInfo[tokenId].currentSubAgentCount--;

        emit SubAgentRemoved(tokenId, subAgentWallet);
    }

    function isSubAgentWhitelisted(uint256 tokenId, address subAgentWallet) 
        external view returns (bool) 
    {
        return _subAgentWhitelists[tokenId][subAgentWallet];
    }

    function getAgent(uint256 tokenId) 
        external view returns (Agent memory) 
    {
        return _agents[tokenId];
    }

    function getAgentByWallet(address agentWallet) 
        external view returns (Agent memory) 
    {
        uint256 tokenId = _walletToTokenId[agentWallet];
        return _agents[tokenId];
    }

    function tokenIdByWallet(address agentWallet) 
        external view returns (uint256) 
    {
        return _walletToTokenId[agentWallet];
    }

    function getFleetInfo(uint256 tokenId) 
        external view returns (FleetInfo memory) 
    {
        return _fleetInfo[tokenId];
    }

    function getAgentCount() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function isAgentActive(uint256 tokenId) external view returns (bool) {
        return _agents[tokenId].active;
    }

    function getAgentsByOperator(address operator) 
        external view returns (uint256[] memory) 
    {
        return _operatorAgents[operator];
    }

    function verifyCapabilities(
        uint256 tokenId, 
        bytes32[] calldata requiredCapabilities
    ) external view returns (bool) {
        return true;
    }

    function getStakeRequirement(Tier tier) public pure returns (uint256) {
        if (tier == Tier.UNRANKED) return 0;
        if (tier == Tier.BRONZE) return 100e18;
        if (tier == Tier.SILVER) return 500e18;
        if (tier == Tier.GOLD) return 2000e18;
        if (tier == Tier.PLATINUM) return 10000e18;
        return 0;
    }

    function _getMaxFleetSize(Tier tier) internal pure returns (uint256) {
        if (tier == Tier.UNRANKED) return 1;
        if (tier == Tier.BRONZE) return 3;
        if (tier == Tier.SILVER) return 10;
        if (tier == Tier.GOLD) return 25;
        if (tier == Tier.PLATINUM) return type(uint256).max;
        return 1;
    }

    function _getMaxDelegationDepth(Tier tier) internal pure returns (uint256) {
        if (tier == Tier.UNRANKED || tier == Tier.BRONZE) return 0;
        if (tier == Tier.SILVER) return 1;
        if (tier == Tier.GOLD) return 2;
        if (tier == Tier.PLATINUM) return 3;
        return 0;
    }

    function _validateAndStake(uint256 amount) internal {
        require(amount > 0, "No stake required");
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        if (from != address(0) && to != address(0)) {
            revert NotTransferable();
        }
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
