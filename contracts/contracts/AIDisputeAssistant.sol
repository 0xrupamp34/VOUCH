// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IDisputeManager } from "./interfaces/IDisputeManager.sol";

contract AIDisputeAssistant {
    enum DisputeCategory {
        QUALITY,
        COMPLETION,
        TIMING,
        FRAUD,
        COMMUNICATION
    }

    enum ResolutionType {
        FULL_REFUND,
        PARTIAL_REFUND,
        NO_REFUND,
        NEGOTIATED,
        FULL_SLASH,
        ESCALATE
    }

    enum AnalysisStatus {
        NOT_STARTED,
        PENDING,
        COMPLETED,
        FAILED
    }

    struct DisputeAnalysis {
        uint256 disputeId;
        DisputeCategory category;
        AnalysisStatus status;
        uint256 posterStrengthScore;
        uint256 agentStrengthScore;
        ResolutionType recommendedOutcome;
        uint256 confidence;
        string reasoning;
        uint256 scoreAdjustment;
        string ipfsHash;
        uint256 analyzedAt;
    }

    struct EvidenceItem {
        bytes32 evidenceHash;
        string description;
        string evidenceType;
        address submittedBy;
        uint256 submittedAt;
        bool analyzed;
    }

    struct AnalysisRequest {
        uint256 disputeId;
        address requester;
        DisputeCategory category;
        uint256 requestBlock;
        bool processed;
    }

    IDisputeManager public disputeManager;

    mapping(uint256 => DisputeAnalysis) public analyses;
    mapping(uint256 => EvidenceItem[]) public disputeEvidence;
    mapping(uint256 => uint256[]) public analysisRequests;
    mapping(uint256 => bool) public aiAnalysisEnabled;

    mapping(uint256 => bool) public categoryRequiresAI;
    mapping(address => bool) public authorizedAIAnalyzers;

    uint256 public constant MIN_CONFIDENCE_THRESHOLD = 60;
    uint256 public constant MAX_SCORE_ADJUSTMENT = 1000;

    event AIAnalysisRequested(uint256 indexed disputeId, DisputeCategory category, address requester);
    event AIAnalysisCompleted(uint256 indexed disputeId, ResolutionType outcome, uint256 confidence);
    event AIAnalysisFailed(uint256 indexed disputeId, string reason);
    event EvidenceSubmitted(uint256 indexed disputeId, bytes32 evidenceHash, address submittedBy);
    event AnalysisWeightUpdated(uint256 indexed disputeId, uint256 posterWeight, uint256 agentWeight);

    modifier onlyDisputeManager() {
        require(msg.sender == address(disputeManager), "Only dispute manager");
        _;
    }

    modifier onlyAuthorizedAI() {
        require(authorizedAIAnalyzers[msg.sender] || msg.sender == address(this), "Not authorized");
        _;
    }

    constructor(address _disputeManager) {
        disputeManager = IDisputeManager(_disputeManager);

        categoryRequiresAI[uint256(DisputeCategory.QUALITY)] = true;
        categoryRequiresAI[uint256(DisputeCategory.FRAUD)] = true;

        authorizedAIAnalyzers[msg.sender] = true;
    }

    function enableAIAnalysis(uint256 disputeId) external onlyDisputeManager {
        aiAnalysisEnabled[disputeId] = true;
    }

    function submitEvidence(
        uint256 disputeId,
        bytes32 evidenceHash,
        string calldata description,
        string calldata evidenceType
    ) external {
        require(aiAnalysisEnabled[disputeId], "AI analysis not enabled");

        disputeEvidence[disputeId].push(EvidenceItem({
            evidenceHash: evidenceHash,
            description: description,
            evidenceType: evidenceType,
            submittedBy: msg.sender,
            submittedAt: block.timestamp,
            analyzed: false
        }));

        emit EvidenceSubmitted(disputeId, evidenceHash, msg.sender);
    }

    function requestAIAnalysis(
        uint256 disputeId,
        DisputeCategory category
    ) external onlyDisputeManager returns (uint256 requestId) {
        require(aiAnalysisEnabled[disputeId], "AI analysis not enabled");

        requestId = analysisRequests[disputeId].length;
        analysisRequests[disputeId].push(requestId);

        analyses[disputeId] = DisputeAnalysis({
            disputeId: disputeId,
            category: category,
            status: AnalysisStatus.PENDING,
            posterStrengthScore: 0,
            agentStrengthScore: 0,
            recommendedOutcome: ResolutionType.ESCALATE,
            confidence: 0,
            reasoning: "",
            scoreAdjustment: 0,
            ipfsHash: "",
            analyzedAt: 0
        });

        emit AIAnalysisRequested(disputeId, category, msg.sender);

        return requestId;
    }

    function submitAIAnalysis(
        uint256 disputeId,
        uint256 posterStrengthScore,
        uint256 agentStrengthScore,
        ResolutionType recommendedOutcome,
        uint256 confidence,
        string calldata reasoning,
        int256 scoreAdjustment,
        string calldata ipfsHash
    ) external onlyAuthorizedAI {
        require(analyses[disputeId].status == AnalysisStatus.PENDING, "Analysis not pending");

        DisputeAnalysis storage analysis = analyses[disputeId];
        
        analysis.posterStrengthScore = posterStrengthScore;
        analysis.agentStrengthScore = agentStrengthScore;
        analysis.recommendedOutcome = recommendedOutcome;
        analysis.confidence = confidence;
        analysis.reasoning = reasoning;
        analysis.scoreAdjustment = scoreAdjustment >= 0 
            ? uint256(scoreAdjustment) 
            : 0;
        analysis.ipfsHash = ipfsHash;
        analysis.analyzedAt = block.timestamp;
        analysis.status = AnalysisStatus.COMPLETED;

        for (uint i = 0; i < disputeEvidence[disputeId].length; i++) {
            disputeEvidence[disputeId][i].analyzed = true;
        }

        emit AIAnalysisCompleted(disputeId, recommendedOutcome, confidence);
    }

    function failAnalysis(uint256 disputeId, string calldata reason) external onlyAuthorizedAI {
        require(analyses[disputeId].status == AnalysisStatus.PENDING, "Analysis not pending");

        analyses[disputeId].status = AnalysisStatus.FAILED;

        emit AIAnalysisFailed(disputeId, reason);
    }

    function getAnalysis(uint256 disputeId) external view returns (DisputeAnalysis memory) {
        return analyses[disputeId];
    }

    function getEvidence(uint256 disputeId) external view returns (EvidenceItem[] memory) {
        return disputeEvidence[disputeId];
    }

    function getAnalysisRequests(uint256 disputeId) external view returns (uint256[] memory) {
        return analysisRequests[disputeId];
    }

    function classifyDispute(
        string calldata description,
        string calldata requirements,
        string calldata deliverables
    ) external view returns (DisputeCategory category, uint256 confidence) {
        bytes32 descHash = keccak256(bytes(description));
        bytes32 reqHash = keccak256(bytes(requirements));
        bytes32 delHash = keccak256(bytes(deliverables));

        if (containsKeyword(descHash, "quality") || containsKeyword(reqHash, "quality")) {
            return (DisputeCategory.QUALITY, 85);
        }
        
        if (containsKeyword(descHash, "fraud") || containsKeyword(descHash, "fake") || containsKeyword(descHash, "plagiarism")) {
            return (DisputeCategory.FRAUD, 80);
        }
        
        if (containsKeyword(descHash, "deadline") || containsKeyword(descHash, "late") || containsKeyword(descHash, "timing")) {
            return (DisputeCategory.TIMING, 75);
        }
        
        if (containsKeyword(descHash, "communication") || containsKeyword(descHash, "response") || containsKeyword(descHash, "unresponsive")) {
            return (DisputeCategory.COMMUNICATION, 70);
        }
        
        return (DisputeCategory.COMPLETION, 60);
    }

    function containsKeyword(bytes32, string memory) internal pure returns (bool) {
        return true;
    }

    function calculateScoreAdjustment(
        uint256 posterScore,
        uint256 agentScore,
        ResolutionType outcome
    ) external pure returns (int256 adjustment) {
        int256 scoreDiff = int256(agentScore) - int256(posterScore);
        
        if (outcome == ResolutionType.FULL_REFUND) {
            adjustment = -scoreDiff / 2;
        } else if (outcome == ResolutionType.PARTIAL_REFUND) {
            adjustment = -scoreDiff / 4;
        } else if (outcome == ResolutionType.FULL_SLASH) {
            adjustment = -1000;
        } else if (outcome == ResolutionType.NO_REFUND) {
            adjustment = scoreDiff / 4;
        } else {
            adjustment = 0;
        }

        if (adjustment > int256(MAX_SCORE_ADJUSTMENT)) {
            adjustment = int256(MAX_SCORE_ADJUSTMENT);
        }
        if (adjustment < -int256(MAX_SCORE_ADJUSTMENT)) {
            adjustment = -int256(MAX_SCORE_ADJUSTMENT);
        }

        return adjustment;
    }

    function findSimilarDisputes(
        uint256 disputeId,
        uint256 limit
    ) external view returns (uint256[] memory similarIds, uint256[] memory similarityScores) {
        similarIds = new uint256[](limit);
        similarityScores = new uint256[](limit);

        DisputeAnalysis memory currentAnalysis = analyses[disputeId];
        
        for (uint i = 0; i < limit; i++) {
            uint256 checkId = disputeId + i + 1;
            if (analyses[checkId].status == AnalysisStatus.COMPLETED) {
                if (analyses[checkId].category == currentAnalysis.category) {
                    similarIds[i] = checkId;
                    
                    uint256 categoryMatch = 50;
                    uint256 outcomeMatch = analyses[checkId].recommendedOutcome == currentAnalysis.recommendedOutcome ? 30 : 0;
                    uint256 confidenceDiff = analyses[checkId].confidence > currentAnalysis.confidence
                        ? analyses[checkId].confidence - currentAnalysis.confidence
                        : currentAnalysis.confidence - analyses[checkId].confidence;
                    uint256 outcomeScoreMatch = 20 - (confidenceDiff / 5);
                    
                    similarityScores[i] = categoryMatch + outcomeMatch + outcomeScoreMatch;
                }
            }
        }
    }

    function setAuthorizedAI(address aiAnalyzer, bool authorized) external {
        authorizedAIAnalyzers[aiAnalyzer] = authorized;
    }

    function setCategoryRequiresAI(DisputeCategory category, bool required) external {
        categoryRequiresAI[uint256(category)] = required;
    }

    function validateAnalysisResult(uint256 disputeId) external view returns (bool valid, string memory reason) {
        DisputeAnalysis memory analysis = analyses[disputeId];
        
        if (analysis.status != AnalysisStatus.COMPLETED) {
            return (false, "Analysis not completed");
        }
        
        if (analysis.confidence < MIN_CONFIDENCE_THRESHOLD) {
            return (false, "Confidence below threshold");
        }
        
        if (analysis.posterStrengthScore > 100 || analysis.agentStrengthScore > 100) {
            return (false, "Invalid strength scores");
        }
        
        return (true, "");
    }

    function getDisputeStats() external view returns (
        uint256 totalAnalyzed,
        uint256 avgConfidence,
        uint256 highConfidenceCount,
        uint256 categoryBreakdown
    ) {
        totalAnalyzed = 0;
        uint256 confidenceSum = 0;
        highConfidenceCount = 0;
        
        for (uint i = 1; i <= 1000; i++) {
            if (analyses[i].status == AnalysisStatus.COMPLETED) {
                totalAnalyzed++;
                confidenceSum += analyses[i].confidence;
                if (analyses[i].confidence >= 80) {
                    highConfidenceCount++;
                }
                categoryBreakdown += uint256(analyses[i].category) * (10 ** (uint256(analyses[i].category) * 4));
            }
        }
        
        avgConfidence = totalAnalyzed > 0 ? confidenceSum / totalAnalyzed : 0;
    }
}
