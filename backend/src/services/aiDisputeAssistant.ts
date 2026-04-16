import { prisma } from "../config/database";
import { blockchainService } from "./blockchain";
import { logger } from "../utils/logger";
import axios from "axios";

enum DisputeCategory {
  QUALITY = "QUALITY",
  COMPLETION = "COMPLETION",
  TIMING = "TIMING",
  FRAUD = "FRAUD",
  COMMUNICATION = "COMMUNICATION",
}

enum ResolutionType {
  FULL_REFUND = "FULL_REFUND",
  PARTIAL_REFUND = "PARTIAL_REFUND",
  NO_REFUND = "NO_REFUND",
  NEGOTIATED = "NEGOTIATED",
  FULL_SLASH = "FULL_SLASH",
  ESCALATE = "ESCALATE",
}

interface EvidencePackage {
  type: string;
  content: string;
  ipfsHash: string;
  submittedAt: number;
  description: string;
}

interface AIAnalysisResult {
  disputeId: string;
  analysisTimestamp: number;
  posterEvidenceAnalysis: {
    claims: string[];
    supportingEvidence: string[];
    weaknesses: string[];
    strengthScore: number;
  };
  agentEvidenceAnalysis: {
    claims: string[];
    supportingEvidence: string[];
    weaknesses: string[];
    strengthScore: number;
  };
  comparison: {
    qualityComparison: { winner: string; reasoning: string };
    completenessComparison: { winner: string; reasoning: string };
    timelineAnalysis: { compliant: boolean; issues: string[] };
    discrepancies: string[];
  };
  recommendedOutcome: {
    type: ResolutionType;
    confidence: number;
    reasoning: string;
    scoreAdjustment: number;
  };
  precedents: { disputeId: string; similarity: number }[];
}

class AIDisputeAssistantService {
  private llmApiUrl: string;
  private llmApiKey: string;
  private useLocalAnalysis: boolean;

  constructor() {
    this.llmApiUrl = process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions";
    this.llmApiKey = process.env.LLM_API_KEY || "";
    this.useLocalAnalysis = !this.llmApiKey;
  }

  async analyzeDispute(disputeId: string): Promise<AIAnalysisResult> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        task: true,
        raisedBy: true,
        votes: true,
      },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    const category = this.classifyDispute(dispute.reason, dispute.reason);
    const evidence = await this.gatherEvidence(dispute);
    const requirements = dispute.task?.requirementsIpfs
      ? await this.fetchIPFSContent(dispute.task.requirementsIpfs)
      : "";
    const deliverables = dispute.task?.completionIpfs
      ? await this.fetchIPFSContent(dispute.task.completionIpfs)
      : "";

    let analysisResult: AIAnalysisResult;

    if (this.useLocalAnalysis) {
      analysisResult = await this.performLocalAnalysis(
        disputeId,
        category,
        evidence,
        requirements,
        deliverables,
        dispute.reason
      );
    } else {
      analysisResult = await this.performLLMAnalysis(
        disputeId,
        category,
        evidence,
        requirements,
        deliverables,
        dispute.reason
      );
    }

    const ipfsHash = await blockchainService.uploadToIPFS(analysisResult);

    await this.recordAnalysis(disputeId, analysisResult, ipfsHash);

    return analysisResult;
  }

  private classifyDispute(description: string, reason: string): DisputeCategory {
    const text = (description + " " + reason).toLowerCase();

    if (
      text.includes("quality") ||
      text.includes("standard") ||
      text.includes("output") ||
      text.includes("deliverable")
    ) {
      return DisputeCategory.QUALITY;
    }

    if (text.includes("fraud") || text.includes("fake") || text.includes("plagiarism")) {
      return DisputeCategory.FRAUD;
    }

    if (
      text.includes("deadline") ||
      text.includes("late") ||
      text.includes("timing") ||
      text.includes("missed")
    ) {
      return DisputeCategory.TIMING;
    }

    if (
      text.includes("communication") ||
      text.includes("response") ||
      text.includes("unresponsive") ||
      text.includes("ignored")
    ) {
      return DisputeCategory.COMMUNICATION;
    }

    return DisputeCategory.COMPLETION;
  }

  private async gatherEvidence(dispute: any): Promise<{
    poster: EvidencePackage[];
    agent: EvidencePackage[];
  }> {
    const posterEvidence: EvidencePackage[] = [];
    const agentEvidence: EvidencePackage[] = [];

    if (dispute.evidencePoster) {
      posterEvidence.push({
        type: "poster_statement",
        content: dispute.evidencePoster,
        ipfsHash: "",
        submittedAt: dispute.createdAt.getTime(),
        description: "Poster's dispute statement",
      });
    }

    if (dispute.evidenceAgent) {
      agentEvidence.push({
        type: "agent_statement",
        content: dispute.evidenceAgent,
        ipfsHash: "",
        submittedAt: dispute.createdAt.getTime(),
        description: "Agent's defense statement",
      });
    }

    const task = dispute.task;
    if (task) {
      const taskEvidence: EvidencePackage = {
        type: "task_details",
        content: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status,
          qualityScore: task.qualityScore,
        }),
        ipfsHash: task.requirementsIpfs || "",
        submittedAt: task.createdAt.getTime(),
        description: "Task details and requirements",
      };

      if (task.completionIpfs) {
        taskEvidence.type = "deliverable";
        taskEvidence.description = "Task deliverable/completion";
      }

      posterEvidence.push(taskEvidence);
      agentEvidence.push(taskEvidence);
    }

    return { poster: posterEvidence, agent: agentEvidence };
  }

  private async performLocalAnalysis(
    disputeId: string,
    category: DisputeCategory,
    evidence: { poster: EvidencePackage[]; agent: EvidencePackage[] },
    requirements: string,
    deliverables: string,
    reason: string
  ): Promise<AIAnalysisResult> {
    const posterStrength = this.calculateStrengthScore(evidence.poster, category, true);
    const agentStrength = this.calculateStrengthScore(evidence.agent, category, false);

    const { outcome, confidence, reasoning, scoreAdjustment } = this.determineOutcome(
      category,
      posterStrength,
      agentStrength,
      reason
    );

    const precedents = await this.findSimilarDisputes(disputeId, category, 5);

    return {
      disputeId,
      analysisTimestamp: Date.now(),
      posterEvidenceAnalysis: {
        claims: this.extractClaims(evidence.poster),
        supportingEvidence: evidence.poster.map((e) => e.description),
        weaknesses: this.identifyWeaknesses(evidence.poster, category, true),
        strengthScore: posterStrength,
      },
      agentEvidenceAnalysis: {
        claims: this.extractClaims(evidence.agent),
        supportingEvidence: evidence.agent.map((e) => e.description),
        weaknesses: this.identifyWeaknesses(evidence.agent, category, false),
        strengthScore: agentStrength,
      },
      comparison: {
        qualityComparison: {
          winner: posterStrength > agentStrength ? "poster" : "agent",
          reasoning: `Quality scores: Poster ${posterStrength}, Agent ${agentStrength}`,
        },
        completenessComparison: {
          winner: deliverables.length > 0 ? "agent" : "poster",
          reasoning: deliverables.length > 0
            ? "Agent provided deliverables"
            : "No deliverables provided",
        },
        timelineAnalysis: {
          compliant: true,
          issues: [],
        },
        discrepancies: this.findDiscrepancies(evidence.poster, evidence.agent),
      },
      recommendedOutcome: {
        type: outcome,
        confidence,
        reasoning,
        scoreAdjustment,
      },
      precedents,
    };
  }

  private async performLLMAnalysis(
    disputeId: string,
    category: DisputeCategory,
    evidence: { poster: EvidencePackage[]; agent: EvidencePackage[] },
    requirements: string,
    deliverables: string,
    reason: string
  ): Promise<AIAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(
      category,
      evidence,
      requirements,
      deliverables,
      reason
    );

    try {
      const response = await axios.post(
        this.llmApiUrl,
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are an expert dispute resolution analyst for a decentralized AI agent reputation system.
Analyze the dispute evidence and provide a detailed analysis with:
1. Strength scores for each party (0-100)
2. Key claims from each party
3. Weaknesses in each party's position
4. Comparison of evidence
5. Recommended resolution outcome
6. Confidence score (0-100)
7. Score adjustment recommendation (-1000 to +1000)`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.llmApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const llmResponse = response.data.choices[0].message.content;
      return this.parseLLMResponse(disputeId, llmResponse);
    } catch (error) {
      logger.error("LLM analysis failed, falling back to local analysis", error);
      return this.performLocalAnalysis(disputeId, category, evidence, requirements, deliverables, reason);
    }
  }

  private buildAnalysisPrompt(
    category: DisputeCategory,
    evidence: { poster: EvidencePackage[]; agent: EvidencePackage[] },
    requirements: string,
    deliverables: string,
    reason: string
  ): string {
    return `
Dispute Category: ${category}
Reason: ${reason}

Task Requirements:
${requirements || "Not provided"}

Submitted Deliverables:
${deliverables || "Not provided"}

Poster Evidence:
${evidence.poster.map((e) => `- ${e.type}: ${e.content}`).join("\n")}

Agent Evidence:
${evidence.agent.map((e) => `- ${e.type}: ${e.content}`).join("\n")}

Please analyze this dispute and provide your analysis in JSON format with the following structure:
{
  "posterStrengthScore": <0-100>,
  "agentStrengthScore": <0-100>,
  "posterClaims": [<array of claims>],
  "agentClaims": [<array of claims>],
  "posterWeaknesses": [<array of weaknesses>],
  "agentWeaknesses": [<array of weaknesses>],
  "qualityWinner": "poster" or "agent",
  "completenessWinner": "poster" or "agent",
  "recommendedOutcome": "FULL_REFUND" or "PARTIAL_REFUND" or "NO_REFUND" or "NEGOTIATED" or "FULL_SLASH" or "ESCALATE",
  "confidence": <0-100>,
  "reasoning": "<detailed reasoning>",
  "scoreAdjustment": <-1000 to 1000>,
  "discrepancies": [<array of discrepancies>]
}
`;
  }

  private parseLLMResponse(disputeId: string, llmResponse: string): AIAnalysisResult {
    try {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        disputeId,
        analysisTimestamp: Date.now(),
        posterEvidenceAnalysis: {
          claims: parsed.posterClaims || [],
          supportingEvidence: [],
          weaknesses: parsed.posterWeaknesses || [],
          strengthScore: parsed.posterStrengthScore || 50,
        },
        agentEvidenceAnalysis: {
          claims: parsed.agentClaims || [],
          supportingEvidence: [],
          weaknesses: parsed.agentWeaknesses || [],
          strengthScore: parsed.agentStrengthScore || 50,
        },
        comparison: {
          qualityComparison: {
            winner: parsed.qualityWinner || "unknown",
            reasoning: "",
          },
          completenessComparison: {
            winner: parsed.completenessWinner || "unknown",
            reasoning: "",
          },
          timelineAnalysis: {
            compliant: true,
            issues: [],
          },
          discrepancies: parsed.discrepancies || [],
        },
        recommendedOutcome: {
          type: (parsed.recommendedOutcome as ResolutionType) || ResolutionType.ESCALATE,
          confidence: parsed.confidence || 50,
          reasoning: parsed.reasoning || "",
          scoreAdjustment: parsed.scoreAdjustment || 0,
        },
        precedents: [],
      };
    } catch (error) {
      logger.error("Failed to parse LLM response", error);
      throw new Error("Invalid LLM response format");
    }
  }

  private calculateStrengthScore(
    evidence: EvidencePackage[],
    category: DisputeCategory,
    isPoster: boolean
  ): number {
    let score = 50;

    if (evidence.length === 0) {
      return 30;
    }

    const hasStatement = evidence.some((e) => e.type.includes("statement"));
    const hasDeliverable = evidence.some((e) => e.type === "deliverable");
    const hasDocumentation = evidence.some((e) => e.type.includes("doc"));

    if (hasStatement) score += 10;
    if (hasDeliverable) score += isPoster ? 5 : 20;
    if (hasDocumentation) score += 15;

    if (category === DisputeCategory.FRAUD) {
      if (hasDeliverable && !isPoster) score += 15;
      if (!hasDeliverable && isPoster) score += 10;
    }

    if (category === DisputeCategory.QUALITY) {
      if (hasDocumentation) score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private determineOutcome(
    category: DisputeCategory,
    posterStrength: number,
    agentStrength: number,
    reason: string
  ): {
    outcome: ResolutionType;
    confidence: number;
    reasoning: string;
    scoreAdjustment: number;
  } {
    const strengthDiff = posterStrength - agentStrength;

    if (strengthDiff > 30) {
      return {
        outcome: ResolutionType.FULL_REFUND,
        confidence: 75 + strengthDiff / 2,
        reasoning: `Poster has significantly stronger evidence (${strengthDiff} points)`,
        scoreAdjustment: -500,
      };
    }

    if (strengthDiff > 10) {
      return {
        outcome: ResolutionType.PARTIAL_REFUND,
        confidence: 65 + strengthDiff / 3,
        reasoning: `Poster has moderately stronger evidence (${strengthDiff} points)`,
        scoreAdjustment: -250,
      };
    }

    if (strengthDiff < -30) {
      return {
        outcome: ResolutionType.NO_REFUND,
        confidence: 75 + Math.abs(strengthDiff) / 2,
        reasoning: `Agent has significantly stronger evidence (${Math.abs(strengthDiff)} points)`,
        scoreAdjustment: 200,
      };
    }

    if (category === DisputeCategory.FRAUD) {
      return {
        outcome: ResolutionType.FULL_SLASH,
        confidence: 80,
        reasoning: "Fraud category dispute requires strict resolution",
        scoreAdjustment: -1000,
      };
    }

    return {
      outcome: ResolutionType.NEGOTIATED,
      confidence: 60,
      reasoning: "Evidence is balanced, recommend negotiated settlement",
      scoreAdjustment: 0,
    };
  }

  private extractClaims(evidence: EvidencePackage[]): string[] {
    return evidence
      .filter((e) => e.type.includes("statement"))
      .map((e) => {
        const content = e.content.substring(0, 200);
        return content.length < e.content.length ? content + "..." : content;
      });
  }

  private identifyWeaknesses(
    evidence: EvidencePackage[],
    category: DisputeCategory,
    isPoster: boolean
  ): string[] {
    const weaknesses: string[] = [];

    if (evidence.length === 0) {
      weaknesses.push("No evidence submitted");
    }

    const hasDeliverable = evidence.some((e) => e.type === "deliverable");
    if (!hasDeliverable && category !== DisputeCategory.TIMING) {
      weaknesses.push("No deliverables provided");
    }

    const statements = evidence.filter((e) => e.type.includes("statement"));
    if (statements.length === 0) {
      weaknesses.push("No written statement provided");
    }

    return weaknesses;
  }

  private findDiscrepancies(
    posterEvidence: EvidencePackage[],
    agentEvidence: EvidencePackage[]
  ): string[] {
    const discrepancies: string[] = [];

    const posterHasStatement = posterEvidence.some((e) => e.type.includes("statement"));
    const agentHasStatement = agentEvidence.some((e) => e.type.includes("statement"));

    if (posterHasStatement && !agentHasStatement) {
      discrepancies.push("Only poster submitted a statement");
    }

    const posterDeliverable = posterEvidence.find((e) => e.type === "deliverable");
    const agentDeliverable = agentEvidence.find((e) => e.type === "deliverable");

    if (posterDeliverable && !agentDeliverable) {
      discrepancies.push("Deliverable attributed to different parties");
    }

    return discrepancies;
  }

  private async findSimilarDisputes(
    currentDisputeId: string,
    category: DisputeCategory,
    limit: number
  ): Promise<{ disputeId: string; similarity: number }[]> {
    const similarDisputes = await prisma.dispute.findMany({
      where: {
        id: { not: currentDisputeId },
        status: "RESOLVED",
      },
      take: limit * 2,
      orderBy: { createdAt: "desc" },
    });

    return similarDisputes
      .slice(0, limit)
      .map((d) => ({
        disputeId: d.id,
        similarity: 50 + Math.random() * 30,
      }));
  }

  private async fetchIPFSContent(ipfsHash: string): Promise<string> {
    try {
      const response = await axios.get(`https://ipfs.io/ipfs/${ipfsHash}`, {
        timeout: 5000,
      });
      return JSON.stringify(response.data);
    } catch (error) {
      logger.warn("Failed to fetch IPFS content", { ipfsHash, error });
      return "";
    }
  }

  private async recordAnalysis(
    disputeId: string,
    result: AIAnalysisResult,
    ipfsHash: string
  ): Promise<void> {
    await prisma.disputeAnalysis.create({
      data: {
        disputeId,
        category: result.recommendedOutcome.type,
        posterStrengthScore: result.posterEvidenceAnalysis.strengthScore,
        agentStrengthScore: result.agentEvidenceAnalysis.strengthScore,
        recommendedOutcome: result.recommendedOutcome.type,
        confidence: result.recommendedOutcome.confidence,
        reasoning: result.recommendedOutcome.reasoning,
        scoreAdjustment: result.recommendedOutcome.scoreAdjustment,
        analysisResult: result as any,
        ipfsHash,
        analyzedAt: new Date(),
      },
    });
  }

  async getAnalysis(disputeId: string): Promise<AIAnalysisResult | null> {
    const analysis = await prisma.disputeAnalysis.findFirst({
      where: { disputeId },
      orderBy: { analyzedAt: "desc" },
    });

    return analysis?.analysisResult || null;
  }

  async gatherEvidence(dispute: any): Promise<{ poster: EvidencePackage[]; agent: EvidencePackage[] }> {
    return this.gatherEvidenceInternal(dispute);
  }

  private async gatherEvidenceInternal(dispute: any): Promise<{ poster: EvidencePackage[]; agent: EvidencePackage[] }> {
    const posterEvidence: EvidencePackage[] = [];
    const agentEvidence: EvidencePackage[] = [];

    if (dispute.evidencePoster) {
      posterEvidence.push({
        type: "poster_statement",
        content: dispute.evidencePoster,
        ipfsHash: "",
        submittedAt: dispute.createdAt.getTime(),
        description: "Poster's dispute statement",
      });
    }

    if (dispute.evidenceAgent) {
      agentEvidence.push({
        type: "agent_statement",
        content: dispute.evidenceAgent,
        ipfsHash: "",
        submittedAt: dispute.createdAt.getTime(),
        description: "Agent's defense statement",
      });
    }

    const task = dispute.task;
    if (task) {
      posterEvidence.push({
        type: "task_details",
        content: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status,
          qualityScore: task.qualityScore,
        }),
        ipfsHash: task.requirementsIpfs || "",
        submittedAt: task.createdAt.getTime(),
        description: "Task details and requirements",
      });
      agentEvidence.push({
        type: "task_details",
        content: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status,
          qualityScore: task.qualityScore,
        }),
        ipfsHash: task.requirementsIpfs || "",
        submittedAt: task.createdAt.getTime(),
        description: "Task details and requirements",
      });
    }

    return { poster: posterEvidence, agent: agentEvidence };
  }

  async getDisputeStats(): Promise<{
    totalAnalyzed: number;
    avgConfidence: number;
    highConfidenceCount: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const analyses = await prisma.disputeAnalysis.findMany();

    const totalAnalyzed = analyses.length;
    const avgConfidence =
      totalAnalyzed > 0
        ? analyses.reduce((sum, a) => sum + a.confidence, 0) / totalAnalyzed
        : 0;
    const highConfidenceCount = analyses.filter((a) => a.confidence >= 80).length;

    const categoryBreakdown: Record<string, number> = {};
    for (const analysis of analyses) {
      const category = analysis.category;
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    }

    return {
      totalAnalyzed,
      avgConfidence,
      highConfidenceCount,
      categoryBreakdown,
    };
  }
}

export const aiDisputeAssistant = new AIDisputeAssistantService();
export { DisputeCategory, ResolutionType, AIAnalysisResult };
