// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IAgentRegistry } from "./interfaces/IAgentRegistry.sol";
import { IReputationEngine } from "./interfaces/IReputationEngine.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AgentInsurance {
    using SafeERC20 for IERC20;

    IAgentRegistry public agentRegistry;
    IReputationEngine public reputationEngine;
    IERC20 public usdc;

    uint256 public constant PREMIUM_RATE_BPS = 250;
    uint256 public constant MIN_COVERAGE_AMOUNT = 1000000;
    uint256 public constant MAX_COVERAGE_AMOUNT = 100000000000;
    uint256 public constant CLAIM_WINDOW = 7 days;
    uint256 public constant MIN_TIER_FOR_COVERAGE = 2;

    struct CoveragePolicy {
        uint256 policyId;
        address agentWallet;
        uint256 coverageAmount;
        uint256 premiumPaid;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 maxClaimable;
        uint256 claimedAmount;
    }

    struct Claim {
        uint256 claimId;
        uint256 policyId;
        address claimant;
        uint256 amount;
        string taskId;
        string reason;
        ClaimStatus status;
        uint256 submittedAt;
        uint256 resolvedAt;
        string resolutionNotes;
        uint256 payoutAmount;
    }

    enum ClaimStatus { SUBMITTED, UNDER_REVIEW, APPROVED, DENIED, APPEALED, RESOLVED }

    mapping(uint256 => CoveragePolicy) public policies;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public agentPolicies;
    mapping(uint256 => uint256[]) public policyClaims;

    uint256 public nextPolicyId = 1;
    uint256 public nextClaimId = 1;

    uint256 public totalPremiumsCollected;
    uint256 public totalClaimsPaid;
    uint256 public reserveBalance;

    event PolicyCreated(uint256 indexed policyId, address indexed agent, uint256 coverageAmount);
    event PolicyActivated(uint256 indexed policyId);
    event PolicyExpired(uint256 indexed policyId);
    event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, uint256 amount);
    event ClaimUnderReview(uint256 indexed claimId);
    event ClaimApproved(uint256 indexed claimId, uint256 payoutAmount);
    event ClaimDenied(uint256 indexed claimId, string reason);
    event PayoutExecuted(uint256 indexed claimId, address indexed recipient, uint256 amount);
    event PremiumReceived(address indexed agent, uint256 amount);
    event ReserveDeposited(uint256 amount);
    event ReserveWithdrawn(uint256 amount, address recipient);

    modifier onlyVerifiedAgent(address agentWallet) {
        uint256 tokenId = agentRegistry.tokenIdByWallet(agentWallet);
        require(agentRegistry.isAgentActive(tokenId), "Agent not verified");
        _;
    }

    modifier onlyActivePolicy(uint256 policyId) {
        require(policies[policyId].active, "Policy not active");
        require(block.timestamp >= policies[policyId].startTime, "Policy not started");
        require(block.timestamp <= policies[policyId].endTime, "Policy expired");
        _;
    }

    constructor(address _agentRegistry, address _reputationEngine, address _usdc) {
        agentRegistry = IAgentRegistry(_agentRegistry);
        reputationEngine = IReputationEngine(_reputationEngine);
        usdc = IERC20(_usdc);
    }

    function purchaseCoverage(
        address agentWallet,
        uint256 coverageAmount,
        uint256 durationDays
    ) external onlyVerifiedAgent(agentWallet) returns (uint256 policyId) {
        require(coverageAmount >= MIN_COVERAGE_AMOUNT, "Coverage below minimum");
        require(coverageAmount <= MAX_COVERAGE_AMOUNT, "Coverage exceeds maximum");
        require(durationDays >= 30 && durationDays <= 365, "Invalid duration");

        uint256 tokenId = agentRegistry.tokenIdByWallet(agentWallet);
        var memory score = reputationEngine.getFullScore(tokenId);

        require(uint8(score.tier) >= MIN_TIER_FOR_COVERAGE, "Tier too low for coverage");

        uint256 premium = (coverageAmount * PREMIUM_RATE_BPS * durationDays) / (36500);

        require(usdc.transferFrom(msg.sender, address(this), premium), "Premium transfer failed");

        policyId = nextPolicyId++;

        policies[policyId] = CoveragePolicy({
            policyId: policyId,
            agentWallet: agentWallet,
            coverageAmount: coverageAmount,
            premiumPaid: premium,
            startTime: 0,
            endTime: 0,
            active: false,
            maxClaimable: coverageAmount,
            claimedAmount: 0
        });

        agentPolicies[agentWallet].push(policyId);

        totalPremiumsCollected += premium;
        reserveBalance += premium;

        emit PolicyCreated(policyId, agentWallet, coverageAmount);
        emit PremiumReceived(agentWallet, premium);

        return policyId;
    }

    function activatePolicy(uint256 policyId) external onlyActivePolicy(policyId) {
        CoveragePolicy storage policy = policies[policyId];
        
        uint256 durationDays = (policy.endTime - policy.startTime) / 1 days;
        require(durationDays >= 30 && durationDays <= 365, "Invalid duration");

        policy.active = true;
        
        emit PolicyActivated(policyId);
    }

    function getCoverageQuote(
        address agentWallet,
        uint256 coverageAmount,
        uint256 durationDays
    ) external view returns (uint256 premium, uint256 maxPayout) {
        require(coverageAmount >= MIN_COVERAGE_AMOUNT, "Coverage below minimum");
        require(durationDays >= 30 && durationDays <= 365, "Invalid duration");

        uint256 basePremium = (coverageAmount * PREMIUM_RATE_BPS * durationDays) / (36500);

        uint256 tokenId = agentRegistry.tokenIdByWallet(agentWallet);
        if (tokenId == 0) {
            return (basePremium, coverageAmount);
        }

        var memory agent = agentRegistry.getAgent(tokenId);
        var memory score = reputationEngine.getFullScore(tokenId);

        uint256 discountBps = 0;
        
        if (agent.active && score.tasksCompleted >= 100) {
            discountBps += 100;
        }
        if (uint8(score.tier) >= 3) {
            discountBps += 150;
        }
        if (uint8(score.tier) >= 4) {
            discountBps += 100;
        }

        uint256 finalPremium = basePremium * (10000 - discountBps) / 10000;

        return (finalPremium, coverageAmount);
    }

    function submitClaim(
        uint256 policyId,
        uint256 amount,
        string calldata taskId,
        string calldata reason
    ) external onlyActivePolicy(policyId) returns (uint256 claimId) {
        CoveragePolicy storage policy = policies[policyId];
        
        require(msg.sender == policy.agentWallet, "Not policy holder");
        require(amount > 0, "Amount must be positive");
        require(amount <= policy.coverageAmount - policy.claimedAmount, "Exceeds coverage");

        claimId = nextClaimId++;

        claims[claimId] = Claim({
            claimId: claimId,
            policyId: policyId,
            claimant: msg.sender,
            amount: amount,
            taskId: taskId,
            reason: reason,
            status: ClaimStatus.SUBMITTED,
            submittedAt: block.timestamp,
            resolvedAt: 0,
            resolutionNotes: "",
            payoutAmount: 0
        });

        policyClaims[policyId].push(claimId);

        emit ClaimSubmitted(claimId, policyId, amount);

        return claimId;
    }

    function reviewClaim(uint256 claimId) external onlyActivePolicy(claims[claimId].policyId) {
        Claim storage claim = claims[claimId];
        
        require(claim.status == ClaimStatus.SUBMITTED, "Claim not in submitted state");
        require(
            block.timestamp <= claim.submittedAt + CLAIM_WINDOW,
            "Claim window expired"
        );

        claim.status = ClaimStatus.UNDER_REVIEW;

        emit ClaimUnderReview(claimId);
    }

    function approveClaim(
        uint256 claimId,
        uint256 payoutAmount,
        string calldata resolutionNotes
    ) external {
        Claim storage claim = claims[claimId];
        CoveragePolicy storage policy = policies[claim.policyId];

        require(claim.status == ClaimStatus.UNDER_REVIEW, "Claim not under review");
        require(payoutAmount <= policy.coverageAmount - policy.claimedAmount, "Payout exceeds available");

        claim.status = ClaimStatus.APPROVED;
        claim.payoutAmount = payoutAmount;
        claim.resolutionNotes = resolutionNotes;
        claim.resolvedAt = block.timestamp;

        emit ClaimApproved(claimId, payoutAmount);
    }

    function denyClaim(uint256 claimId, string calldata reason) external {
        Claim storage claim = claims[claimId];

        require(claim.status == ClaimStatus.UNDER_REVIEW, "Claim not under review");

        claim.status = ClaimStatus.DENIED;
        claim.resolutionNotes = reason;
        claim.resolvedAt = block.timestamp;

        emit ClaimDenied(claimId, reason);
    }

    function executePayout(uint256 claimId) external {
        Claim storage claim = claims[claimId];
        CoveragePolicy storage policy = policies[claim.policyId];

        require(claim.status == ClaimStatus.APPROVED, "Claim not approved");
        require(claim.payoutAmount > 0, "No payout amount");
        require(claim.payoutAmount <= reserveBalance, "Insufficient reserves");

        claim.status = ClaimStatus.RESOLVED;
        policy.claimedAmount += claim.payoutAmount;
        reserveBalance -= claim.payoutAmount;
        totalClaimsPaid += claim.payoutAmount;

        require(usdc.safeTransfer(claim.claimant, claim.payoutAmount), "Payout transfer failed");

        emit PayoutExecuted(claimId, claim.claimant, claim.payoutAmount);
    }

    function depositToReserve(uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        reserveBalance += amount;

        emit ReserveDeposited(amount);
    }

    function withdrawFromReserve(uint256 amount, address recipient) external {
        require(amount <= reserveBalance, "Insufficient reserves");

        reserveBalance -= amount;
        require(usdc.safeTransfer(recipient, amount), "Transfer failed");

        emit ReserveWithdrawn(amount, recipient);
    }

    function getAgentPolicies(address agentWallet) external view returns (uint256[] memory) {
        return agentPolicies[agentWallet];
    }

    function getPolicyClaims(uint256 policyId) external view returns (uint256[] memory) {
        return policyClaims[policyId];
    }

    function getCoverageStats() external view returns (
        uint256 _totalPremiumsCollected,
        uint256 _totalClaimsPaid,
        uint256 _reserveBalance,
        uint256 _activePolicies,
        uint256 _pendingClaims
    ) {
        uint256 activePoliciesCount = 0;
        uint256 pendingClaimsCount = 0;

        for (uint256 i = 1; i < nextPolicyId; i++) {
            if (policies[i].active && block.timestamp <= policies[i].endTime) {
                activePoliciesCount++;
            }
        }

        for (uint256 i = 1; i < nextClaimId; i++) {
            if (claims[i].status == ClaimStatus.SUBMITTED || claims[i].status == ClaimStatus.UNDER_REVIEW) {
                pendingClaimsCount++;
            }
        }

        return (
            totalPremiumsCollected,
            totalClaimsPaid,
            reserveBalance,
            activePoliciesCount,
            pendingClaimsCount
        );
    }

    function calculateRiskScore(address agentWallet) external view returns (uint256 riskScore) {
        uint256 tokenId = agentRegistry.tokenIdByWallet(agentWallet);
        if (tokenId == 0) return 10000;

        var memory score = reputationEngine.getFullScore(tokenId);
        
        riskScore = 10000;

        if (score.tasksCompleted < 10) {
            riskScore += 1000;
        } else if (score.tasksCompleted >= 100) {
            riskScore -= 500;
        }

        uint256 failRate = score.tasksCompleted > 0 
            ? (score.tasksFailed * 10000) / (score.tasksCompleted + score.tasksFailed)
            : 0;
        riskScore += failRate / 2;

        if (uint8(score.tier) >= 3) {
            riskScore -= 300;
        }
        if (uint8(score.tier) >= 4) {
            riskScore -= 200;
        }

        return riskScore;
    }
}
