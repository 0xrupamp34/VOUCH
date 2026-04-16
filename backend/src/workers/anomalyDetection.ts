import { EventEmitter } from "events";
import { logger } from "../utils/logger";
import { prisma } from "../config/database";
import { redis, redisKeys } from "../config/redis";
import { notificationWorker } from "./notifications";

interface AnomalyDetectionConfig {
  scoreVelocityThreshold: number;
  taskFrequencyThreshold: number;
  qualityConsistencyThreshold: number;
}

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  scoreVelocityThreshold: 500,
  taskFrequencyThreshold: 20,
  qualityConsistencyThreshold: 95,
};

class AnomalyDetectionWorker extends EventEmitter {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private config: AnomalyDetectionConfig = DEFAULT_CONFIG;

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.interval = setInterval(() => this.runDetectionCycle(), 60000);

    logger.info("Anomaly detection worker started");
  }

  async stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    logger.info("Anomaly detection worker stopped");
  }

  private async runDetectionCycle() {
    try {
      const activeAgents = await prisma.agent.findMany({
        where: { isActive: true },
        select: { id: true, agentAddr: true, operatorAddr: true },
        take: 100,
      });

      for (const agent of activeAgents) {
        await this.detectAnomalies(agent.id);
      }
    } catch (error) {
      logger.error("Error in anomaly detection cycle:", error);
    }
  }

  async detectAnomalies(agentId: string) {
    const alerts: any[] = [];

    const rapidFarmingAlert = await this.detectRapidFarming(agentId);
    if (rapidFarmingAlert) alerts.push(rapidFarmingAlert);

    const qualityInflationAlert = await this.detectQualityInflation(agentId);
    if (qualityInflationAlert) alerts.push(qualityInflationAlert);

    const sybilAlert = await this.detectPotentialSybil(agentId);
    if (sybilAlert) alerts.push(sybilAlert);

    const collusionAlert = await this.detectPotentialCollusion(agentId);
    if (collusionAlert) alerts.push(collusionAlert);

    for (const alert of alerts) {
      await this.recordAlert(alert);
    }

    return alerts;
  }

  private async detectRapidFarming(agentId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentTasks = await prisma.reputationHistory.count({
      where: {
        agentId,
        createdAt: { gte: oneHourAgo },
        reason: { contains: "task" },
      },
    });

    if (recentTasks > this.config.taskFrequencyThreshold) {
      return {
        agentId,
        anomalyType: "RAPID_FARMING",
        severity: "HIGH",
        confidence: Math.min(95, 50 + (recentTasks - this.config.taskFrequencyThreshold) * 5),
        description: `Agent completed ${recentTasks} tasks in the last hour (threshold: ${this.config.taskFrequencyThreshold})`,
        evidence: { taskCount: recentTasks, threshold: this.config.taskFrequencyThreshold },
      };
    }

    return null;
  }

  private async detectQualityInflation(agentId: string) {
    const recentHistory = await prisma.reputationHistory.findMany({
      where: {
        agentId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (recentHistory.length < 10) return null;

    const perfectScores = recentHistory.filter((h) => h.delta > 80);
    const perfectRatio = perfectScores.length / recentHistory.length;

    if (perfectRatio > 0.9) {
      return {
        agentId,
        anomalyType: "QUALITY_ANOMALY",
        severity: "MEDIUM",
        confidence: Math.round(perfectRatio * 100),
        description: `Agent has ${perfectRatio * 100}% high-quality scores (unusual pattern)`,
        evidence: { perfectRatio, totalTasks: recentHistory.length },
      };
    }

    return null;
  }

  private async detectPotentialSybil(agentId: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        fingerprint: true,
      },
    });

    if (!agent || !agent.fingerprint) return null;

    const similarAgents = await prisma.agentFingerprint.findMany({
      where: {
        id: { not: agentId },
        featuresHash: agent.fingerprint.featuresHash,
      },
    });

    if (similarAgents.length > 0) {
      return {
        agentId,
        anomalyType: "SYBIL_ATTACK",
        severity: "CRITICAL",
        confidence: 80 + similarAgents.length * 5,
        description: `Agent shares behavioral fingerprint with ${similarAgents.length} other agents`,
        evidence: { similarAgents: similarAgents.map((a) => a.agentId) },
      };
    }

    return null;
  }

  private async detectPotentialCollusion(agentId: string) {
    const recentTasks = await prisma.task.findMany({
      where: {
        agentId,
        status: { in: ["VERIFIED", "DISPUTED"] },
        completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: {
        dispute: true,
      },
    });

    const posterCounts = new Map<string, number>();
    for (const task of recentTasks) {
      const count = posterCounts.get(task.posterAddr) || 0;
      posterCounts.set(task.posterAddr, count + 1);
    }

    for (const [poster, count] of posterCounts.entries()) {
      if (count > recentTasks.length * 0.5 && recentTasks.length > 5) {
        return {
          agentId,
          anomalyType: "COLLUSION",
          severity: "HIGH",
          confidence: Math.min(90, 60 + count * 5),
          description: `Agent has completed ${count} of ${recentTasks.length} tasks with the same poster`,
          evidence: { poster, count, totalTasks: recentTasks.length },
        };
      }
    }

    return null;
  }

  private async recordAlert(alert: any) {
    try {
      const existingAlert = await prisma.anomalyAlert.findFirst({
        where: {
          agentId: alert.agentId,
          anomalyType: alert.anomalyType,
          resolved: false,
          detectedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });

      if (existingAlert) {
        await prisma.anomalyAlert.update({
          where: { id: existingAlert.id },
          data: {
            confidence: Math.max(existingAlert.confidence, alert.confidence),
            description: alert.description,
            evidence: alert.evidence,
          },
        });
        return;
      }

      const newAlert = await prisma.anomalyAlert.create({
        data: {
          agentId: alert.agentId,
          anomalyType: alert.anomalyType,
          severity: alert.severity,
          confidence: alert.confidence,
          description: alert.description,
          evidence: alert.evidence,
        },
      });

      const agent = await prisma.agent.findUnique({
        where: { id: alert.agentId },
      });

      if (agent && alert.severity === "CRITICAL") {
        notificationWorker.emit("anomalyDetected", {
          agentId: alert.agentId,
          operator: agent.operatorAddr,
          anomalyType: alert.anomalyType,
          severity: alert.severity,
        });
      }

      await redis.lpush(redisKeys.anomalyAlerts, JSON.stringify(newAlert));

      logger.warn("Anomaly detected:", alert);
    } catch (error) {
      logger.error("Error recording anomaly alert:", error);
    }
  }

  async processAnomalyAlert(alertId: string, action: "acknowledge" | "resolve", notes?: string) {
    const updateData: any = {};

    if (action === "acknowledge") {
      updateData.acknowledged = true;
      updateData.acknowledgedAt = new Date();
    } else if (action === "resolve") {
      updateData.resolved = true;
      updateData.resolvedAt = new Date();
      updateData.resolutionNotes = notes;
    }

    return prisma.anomalyAlert.update({
      where: { id: alertId },
      data: updateData,
    });
  }

  async getAlerts(options: {
    agentId?: string;
    severity?: string;
    acknowledged?: boolean;
    limit?: number;
  }) {
    const where: any = {};

    if (options.agentId) where.agentId = options.agentId;
    if (options.severity) where.severity = options.severity;
    if (options.acknowledged !== undefined) where.acknowledged = options.acknowledged;

    return prisma.anomalyAlert.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      take: options.limit || 50,
    });
  }
}

export const anomalyDetectionWorker = new AnomalyDetectionWorker();
