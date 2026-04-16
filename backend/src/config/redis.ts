import Redis from "ioredis";
import { config } from "./env";
import { logger } from "../utils/logger";

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
    if (targetErrors.some((e) => err.message.includes(e))) {
      return true;
    }
    return false;
  },
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("ready", () => {
  logger.info("Redis ready");
});

redis.on("error", (err) => {
  logger.error("Redis error:", err);
});

redis.on("close", () => {
  logger.warn("Redis connection closed");
});

export const redisKeys = {
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
  session: (wallet: string) => `session:${wallet}`,
  agentScore: (agentId: string) => `agent:score:${agentId}`,
  taskCache: (taskId: string) => `task:${taskId}`,
  leaderboard: "leaderboard",
  verificationRequest: (requestId: string) => `verification:${requestId}`,
  anomalyAlerts: "anomaly:alerts",
  wsSubscription: (clientId: string) => `ws:sub:${clientId}`,
};

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const data = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, data);
  } else {
    await redis.set(key, data);
  }
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count;
}

export async function getRateLimitCount(key: string): Promise<number> {
  const count = await redis.get(key);
  return count ? parseInt(count, 10) : 0;
}

export async function publishMessage(channel: string, message: unknown): Promise<void> {
  await redis.publish(channel, JSON.stringify(message));
}
