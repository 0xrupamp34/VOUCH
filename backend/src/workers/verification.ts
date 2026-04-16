import { EventEmitter } from "events";
import { logger } from "../utils/logger";
import { prisma } from "../config/database";
import { redis, redisKeys } from "../config/redis";
import { blockchainService } from "../services/blockchain";
import axios from "axios";

class VerificationWorker extends EventEmitter {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.interval = setInterval(() => this.processVerificationQueue(), 30000);

    logger.info("Verification worker started");
  }

  async stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    logger.info("Verification worker stopped");
  }

  private async processVerificationQueue() {
    try {
      const pendingTasks = await prisma.task.findMany({
        where: {
          status: "SUBMISSION_PENDING",
        },
        take: 10,
      });

      for (const task of pendingTasks) {
        await this.verifyTask(task.taskId);
      }
    } catch (error) {
      logger.error("Error processing verification queue:", error);
    }
  }

  async verifyTask(taskId: string) {
    const lockKey = `verification:lock:${taskId}`;
    const lock = await redis.set(lockKey, "1", "EX", 300, "NX");

    if (!lock) {
      logger.debug(`Task ${taskId} already being verified`);
      return;
    }

    try {
      logger.info(`Verifying task: ${taskId}`);

      const task = await prisma.task.findUnique({ where: { taskId } });
      if (!task) {
        logger.warn(`Task ${taskId} not found`);
        return;
      }

      const requestId = await blockchainService.requestVerification(taskId);
      logger.info(`Verification requested for task ${taskId}, request ID: ${requestId}`);

      await redis.setex(redisKeys.verificationRequest(requestId), 3600, JSON.stringify({
        taskId,
        requestedAt: Date.now(),
        status: "pending",
      }));

      this.emit("verificationRequested", { taskId, requestId });
    } catch (error) {
      logger.error(`Error verifying task ${taskId}:`, error);
    } finally {
      await redis.del(lockKey);
    }
  }

  async handleOracleCallback(requestId: string, response: Uint8Array) {
    try {
      const requestData = await redis.get(redisKeys.verificationRequest(requestId));
      if (!requestData) {
        logger.warn(`Request ${requestId} not found in cache`);
        return;
      }

      const { taskId } = JSON.parse(requestData);

      const decodedResponse = this.decodeOracleResponse(response);

      logger.info(`Oracle callback for task ${taskId}:`, decodedResponse);

      await prisma.task.update({
        where: { taskId },
        data: {
          status: decodedResponse.success ? "VERIFIED" : "FAILED",
          qualityScore: decodedResponse.qualityScore,
          completedAt: new Date(),
        },
      });

      await redis.del(redisKeys.verificationRequest(requestId));

      this.emit("verificationComplete", { taskId, ...decodedResponse });
    } catch (error) {
      logger.error(`Error handling oracle callback for ${requestId}:`, error);
    }
  }

  private decodeOracleResponse(response: Uint8Array): {
    success: boolean;
    qualityScore: number;
    onTime: boolean;
    taskId: string;
  } {
    if (response.length < 32) {
      return { success: false, qualityScore: 0, onTime: false, taskId: "" };
    }

    const data = Buffer.from(response).readBigUInt64LE(0);

    const taskId = "0x" + (data & BigInt(0xFFFFFFFFFFFFFFFFn)).toString(16).padStart(16, "0");
    const qualityScore = Number((data >> 48n) & BigInt(0xFF));
    const onTime = Boolean((data >> 56n) & BigInt(1));
    const success = Boolean((data >> 63n) & BigInt(1));

    return { success, qualityScore, onTime, taskId };
  }
}

export const verificationWorker = new VerificationWorker();
