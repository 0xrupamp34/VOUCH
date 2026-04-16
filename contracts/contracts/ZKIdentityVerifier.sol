// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IAgentRegistry } from "./interfaces/IAgentRegistry.sol";
import { IReputationEngine } from "./interfaces/IReputationEngine.sol";

contract ZKIdentityVerifier {
    IAgentRegistry public agentRegistry;
    IReputationEngine public reputationEngine;

    uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 public constant GENERATOR = 1;

    struct IdentityCommitment {
        address agentWallet;
        bytes32 secretHash;
        bytes32nullifier;
        uint256[2] commitment;
        uint256 timestamp;
        bool active;
    }

    struct ProofInput {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[2] pubSignals;
    }

    struct ZKCredential {
        bytes32 credentialId;
        address agentWallet;
        bytes32 schemaHash;
        uint256 issuedAt;
        uint256 expiresAt;
        uint256[2] commitment;
        bytes32 nullifierHash;
        bool revoked;
    }

    mapping(address => IdentityCommitment) public identityCommitments;
    mapping(bytes32 => ZKCredential) public credentials;
    mapping(bytes32 => bool) public nullifierUsed;
    mapping(bytes32 => bool) public schemaApproved;

    bytes32[] public registeredCommitments;
    bytes32[] public revokedNullifiers;

    event IdentityRegistered(address indexed agent, bytes32 commitment, uint256 timestamp);
    event CredentialIssued(bytes32 indexed credentialId, address indexed agent, bytes32 schemaHash);
    event CredentialRevoked(bytes32 indexed credentialId);
    event SchemaApproved(bytes32 indexed schemaHash, uint256 timestamp);
    event ProofVerified(address indexed prover, bytes32 nullifierHash, bytes32 schemaHash);

    modifier onlyWithCommitment(address agent) {
        require(identityCommitments[agent].active, "No identity commitment");
        _;
    }

    constructor(address _agentRegistry, address _reputationEngine) {
        agentRegistry = IAgentRegistry(_agentRegistry);
        reputationEngine = IReputationEngine(_reputationEngine);

        schemaApproved[keccak256(abi.encodePacked("agent_verification"))] = true;
        schemaApproved[keccak256(abi.encodePacked("tier_proof"))] = true;
        schemaApproved[keccak256(abi.encodePacked("score_range"))] = true;
        schemaApproved[keccak256(abi.encodePacked("operator_proof"))] = true;
    }

    function registerIdentity(bytes32 secretHash, bytes32 nullifierHash, uint256[2] memory commitment) 
        external 
    {
        require(!identityCommitments[msg.sender].active, "Already registered");

        uint256 tokenId = agentRegistry.tokenIdByWallet(msg.sender);
        require(tokenId != 0, "Agent not registered");
        require(agentRegistry.isAgentActive(tokenId), "Agent not active");

        identityCommitments[msg.sender] = IdentityCommitment({
            agentWallet: msg.sender,
            secretHash: secretHash,
            nullifier: nullifierHash,
            commitment: commitment,
            timestamp: block.timestamp,
            active: true
        });

        registeredCommitments.push(keccak256(abi.encodePacked(commitment)));

        emit IdentityRegistered(msg.sender, commitment[0], block.timestamp);
    }

    function updateIdentity(bytes32 newSecretHash, bytes32 newNullifierHash, uint256[2] memory newCommitment) 
        external 
        onlyWithCommitment(msg.sender) 
    {
        IdentityCommitment storage identity = identityCommitments[msg.sender];
        
        identity.secretHash = newSecretHash;
        identity.nullifier = newNullifierHash;
        identity.commitment = newCommitment;
        identity.timestamp = block.timestamp;

        registeredCommitments.push(keccak256(abi.encodePacked(newCommitment)));

        emit IdentityRegistered(msg.sender, newCommitment[0], block.timestamp);
    }

    function revokeIdentity() external onlyWithCommitment(msg.sender) {
        identityCommitments[msg.sender].active = false;
    }

    function issueCredential(
        address agent,
        bytes32 schemaHash,
        uint256 expiresAt,
        bytes32 nullifierHash
    ) external onlyWithCommitment(agent) returns (bytes32 credentialId) {
        require(schemaApproved[schemaHash], "Schema not approved");

        credentialId = keccak256(abi.encodePacked(
            agent,
            schemaHash,
            block.timestamp,
            nullifierHash
        ));

        IdentityCommitment storage identity = identityCommitments[agent];

        credentials[credentialId] = ZKCredential({
            credentialId: credentialId,
            agentWallet: agent,
            schemaHash: schemaHash,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            commitment: identity.commitment,
            nullifierHash: nullifierHash,
            revoked: false
        });

        emit CredentialIssued(credentialId, agent, schemaHash);
    }

    function revokeCredential(bytes32 credentialId) external {
        require(credentials[credentialId].agentWallet == msg.sender, "Not credential owner");
        require(!credentials[credentialId].revoked, "Already revoked");

        credentials[credentialId].revoked = true;
        revokedNullifiers.push(credentials[credentialId].nullifierHash);

        emit CredentialRevoked(credentialId);
    }

    function approveSchema(bytes32 schemaHash) external {
        schemaApproved[schemaHash] = true;
        emit SchemaApproved(schemaHash, block.timestamp);
    }

    function verifyProof(
        ProofInput memory proof,
        bytes32 schemaHash
    ) external view returns (bool valid, string memory reason) {
        require(schemaApproved[schemaHash], "Schema not approved");
        
        if (proof.pubSignals.length < 3) {
            return (false, "Invalid proof structure");
        }

        bytes32 nullifierHash = bytes32(proof.pubSignals[0]);
        if (nullifierUsed[nullifierHash]) {
            return (false, "Nullifier already used");
        }

        uint256 commitmentX = proof.pubSignals[1];
        uint256 commitmentY = proof.pubSignals[2];

        bool commitmentFound = false;
        for (uint i = 0; i < registeredCommitments.length; i++) {
            if (registeredCommitments[i] == keccak256(abi.encodePacked(commitmentX, commitmentY))) {
                commitmentFound = true;
                break;
            }
        }

        if (!commitmentFound) {
            return (false, "Commitment not registered");
        }

        return (true, "");
    }

    function verifyCredentialProof(
        ProofInput memory proof,
        bytes32 credentialId
    ) external view returns (bool valid) {
        ZKCredential memory credential = credentials[credentialId];
        
        require(!credential.revoked, "Credential revoked");
        require(block.timestamp < credential.expiresAt, "Credential expired");
        require(proof.pubSignals[0] == uint256(credential.nullifierHash), "Invalid nullifier");

        return true;
    }

    function getIdentityCommitment(address agent) external view returns (
        bool exists,
        uint256[2] memory commitment,
        uint256 timestamp
    ) {
        IdentityCommitment memory identity = identityCommitments[agent];
        return (identity.active, identity.commitment, identity.timestamp);
    }

    function getCredential(bytes32 credentialId) external view returns (
        address agent,
        bytes32 schemaHash,
        uint256 issuedAt,
        uint256 expiresAt,
        bool revoked
    ) {
        ZKCredential memory credential = credentials[credentialId];
        return (
            credential.agentWallet,
            credential.schemaHash,
            credential.issuedAt,
            credential.expiresAt,
            credential.revoked
        );
    }

    function proveAgentTier(
        address agent,
        uint8 minTier
    ) external view returns (bool eligible, uint8 actualTier) {
        uint256 tokenId = agentRegistry.tokenIdByWallet(agent);
        if (tokenId == 0) return (false, 0);

        var memory score = reputationEngine.getFullScore(tokenId);
        actualTier = uint8(score.tier);
        
        eligible = actualTier >= minTier;
    }

    function proveAgentScoreRange(
        address agent,
        int256 minScore,
        int256 maxScore
    ) external view returns (bool eligible, int256 actualScore) {
        uint256 tokenId = agentRegistry.tokenIdByWallet(agent);
        if (tokenId == 0) return (false, 0);

        var memory score = reputationEngine.getFullScore(tokenId);
        actualScore = score.ewmaScore;
        
        eligible = actualScore >= minScore && actualScore <= maxScore;
    }

    function generateNullifier(address agent, bytes32 externalNullifier) 
        external 
        pure 
        returns (bytes32) 
    {
        return keccak256(abi.encodePacked(agent, externalNullifier));
    }

    function hashCommitment(uint256[2] memory points) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(points[0], points[1]));
    }

    function isSchemaApproved(bytes32 schemaHash) external view returns (bool) {
        return schemaApproved[schemaHash];
    }

    function getStats() external view returns (
        uint256 totalIdentities,
        uint256 totalCredentials,
        uint256 totalRevoked,
        uint256 totalSchemas
    ) {
        totalIdentities = registeredCommitments.length;
        
        uint256 credCount = 0;
        uint256 revokedCount = 0;
        
        for (uint i = 0; i < registeredCommitments.length; i++) {
            bytes32 key = registeredCommitments[i];
            if (credentials[key].issuedAt > 0) {
                credCount++;
                if (credentials[key].revoked) {
                    revokedCount++;
                }
            }
        }
        
        totalCredentials = credCount;
        totalRevoked = revokedCount;
        totalSchemas = 4;
    }
}
