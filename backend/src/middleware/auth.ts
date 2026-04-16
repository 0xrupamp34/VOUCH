import { Request, Response, NextFunction } from "express";
import { SiweMessage } from "siwe";
import { config } from "../config/env";
import { prisma } from "../config/database";
import { redis, redisKeys } from "../config/redis";
import { UnauthorizedError } from "../utils/errors";
import { logger } from "../utils/logger";
import { createSiweMessage, verifySignature } from "../utils/siwe";

declare global {
  namespace Express {
    interface Request {
      user?: {
        wallet: string;
        sessionId: string;
      };
    }
  }
}

export async function siweAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No authorization token provided");
    }

    const token = authHeader.substring(7);

    const sessionData = await redis.get(redisKeys.session(token));
    if (sessionData) {
      const session = JSON.parse(sessionData);
      req.user = {
        wallet: session.wallet,
        sessionId: token,
      };
      next();
      return;
    }

    throw new UnauthorizedError("Session expired or invalid");
  } catch (error) {
    next(error);
  }
}

export async function siweAuthOptional(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const sessionData = await redis.get(redisKeys.session(token));

      if (sessionData) {
        const session = JSON.parse(sessionData);
        req.user = {
          wallet: session.wallet,
          sessionId: token,
        };
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function checkAuth(req: Request): Promise<{ wallet: string } | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const sessionData = await redis.get(redisKeys.session(token));

  if (sessionData) {
    const session = JSON.parse(sessionData);
    return { wallet: session.wallet };
  }

  return null;
}

export async function verifySiweMessage(
  message: string,
  signature: string
): Promise<{ wallet: string; success: boolean }> {
  try {
    const siweMessage = new SiweMessage(message);
    const { data: fields, success: verifySuccess } = await siweMessage.verify({
      signature,
      domain: config.siwe.domain,
    });

    if (!verifySuccess) {
      return { wallet: "", success: false };
    }

    return { wallet: fields.address, success: true };
  } catch (error) {
    logger.error("SIWE verification failed:", error);
    return { wallet: "", success: false };
  }
}

export async function createSession(wallet: string): Promise<string> {
  const sessionId = generateSessionId();

  await redis.setex(
    redisKeys.session(sessionId),
    24 * 60 * 60,
    JSON.stringify({
      wallet: wallet.toLowerCase(),
      createdAt: Date.now(),
    })
  );

  return sessionId;
}

export async function destroySession(sessionId: string): Promise<void> {
  await redis.del(redisKeys.session(sessionId));
}

function generateSessionId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
