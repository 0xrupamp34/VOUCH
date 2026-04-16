import { Router, Request, Response, NextFunction } from "express";
import { generateNonce, verifySignature, createSession } from "../../utils/siwe";
import { redis, redisKeys } from "../../config/redis";
import { logger } from "../../utils/logger";
import { UnauthorizedError, ValidationError } from "../../utils/errors";

const router = Router();

router.post("/challenge", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = req.body;

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      throw new ValidationError("Invalid wallet address");
    }

    const nonce = generateNonce();
    await redis.setex(`siwe:nonce:${wallet.toLowerCase()}`, 300, nonce);

    const siweMessage = new SiweMessage({
      domain: req.headers.host || "localhost",
      address: wallet,
      statement: "Sign in to VOUCH Protocol",
      uri: `https://${req.headers.host}`,
      version: "1",
      chainId: 84532,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    res.json({
      message: siweMessage.prepareMessage(),
      nonce,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      throw new ValidationError("Message and signature are required");
    }

    const siweMessage = new SiweMessage(message);
    const { data, success, error } = await siweMessage.verify({
      signature,
      domain: req.headers.host || "localhost",
    });

    if (!success) {
      logger.warn("SIWE verification failed:", error);
      throw new UnauthorizedError("Invalid signature");
    }

    const sessionId = await createSession(data.address);

    await redis.del(`siwe:nonce:${data.address.toLowerCase()}`);

    res.json({
      success: true,
      sessionId,
      wallet: data.address,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      await redis.del(redisKeys.session(token));
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/session", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No session");
    }

    const token = authHeader.substring(7);
    const sessionData = await redis.get(redisKeys.session(token));

    if (!sessionData) {
      throw new UnauthorizedError("Session expired");
    }

    const session = JSON.parse(sessionData);

    res.json({
      wallet: session.wallet,
      createdAt: new Date(session.createdAt).toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };

import { SiweMessage } from "siwe";
