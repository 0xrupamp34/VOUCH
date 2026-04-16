import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { siweAuth } from "../../middleware/auth";
import { logger } from "../../utils/logger";
import { zkIdentityService, SCHEMA_HASHES } from "../../services/zkIdentity";
import { z } from "zod";

const router = Router();

router.post("/register", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await zkIdentityService.registerIdentity(req.user!.wallet);

    logger.info(`ZK Identity registration initiated`, { wallet: req.user!.wallet });

    res.json({
      success: true,
      identity: {
        secret: result.secret,
        nullifier: result.nullifier,
        commitment: result.commitment,
      },
      warning: "Store secret securely - it cannot be recovered",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/status", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await zkIdentityService.getIdentity(req.user!.wallet);

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/credentials", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = await zkIdentityService.getCredentials(req.user!.wallet);

    res.json({
      success: true,
      credentials,
    });
  } catch (error) {
    next(error);
  }
});

const issueCredentialSchema = z.object({
  schema: z.enum(["AGENT_VERIFICATION", "TIER_PROOF", "SCORE_RANGE", "OPERATOR_PROOF"]),
  expiresInDays: z.number().min(1).max(365),
});

router.post("/credentials/issue", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = issueCredentialSchema.parse(req.body);

    const schemaMap: Record<string, string> = {
      AGENT_VERIFICATION: SCHEMA_HASHES.AGENT_VERIFICATION,
      TIER_PROOF: SCHEMA_HASHES.TIER_PROOF,
      SCORE_RANGE: SCHEMA_HASHES.SCORE_RANGE,
      OPERATOR_PROOF: SCHEMA_HASHES.OPERATOR_PROOF,
    };

    const schemaHash = schemaMap[validated.schema];

    const result = await zkIdentityService.issueCredential(
      req.user!.wallet,
      schemaHash,
      validated.expiresInDays
    );

    logger.info(`ZK Credential issued`, {
      wallet: req.user!.wallet,
      schema: validated.schema,
    });

    res.json({
      success: true,
      credential: {
        credentialId: result.credentialId,
        nullifier: result.nullifier,
        schema: validated.schema,
        schemaHash,
        expiresInDays: validated.expiresInDays,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    next(error);
  }
});

router.post("/credentials/:credentialId/revoke", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credentialId } = req.params;

    await zkIdentityService.revokeCredential(credentialId, req.user!.wallet);

    logger.info(`ZK Credential revoked`, {
      wallet: req.user!.wallet,
      credentialId,
    });

    res.json({
      success: true,
      message: "Credential revoked successfully",
    });
  } catch (error) {
    next(error);
  }
});

const proofSchema = z.object({
  a: z.tuple([z.string(), z.string()]),
  b: z.array(z.tuple([z.string(), z.string()])).length(2),
  c: z.tuple([z.string(), z.string()]),
  pubSignals: z.array(z.string()),
});

router.post("/prove/tier", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { minTier, proof } = req.body;

    const validatedProof = proofSchema.parse(proof);

    const result = await zkIdentityService.proveAgentTier(
      req.user!.wallet,
      minTier,
      validatedProof
    );

    res.json({
      success: true,
      proof: {
        valid: result.valid,
        tier: result.tier,
        tierLabel: ["UNRANKED", "BRONZE", "SILVER", "GOLD", "PLATINUM"][result.tier] || "UNKNOWN",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid proof format" });
    }
    next(error);
  }
});

router.post("/prove/score", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { minScore, maxScore, proof } = req.body;

    const validatedProof = proofSchema.parse(proof);

    const result = await zkIdentityService.proveAgentScore(
      req.user!.wallet,
      minScore,
      maxScore,
      validatedProof
    );

    res.json({
      success: true,
      proof: {
        valid: result.valid,
        score: result.score,
        range: { min: minScore, max: maxScore },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid proof format" });
    }
    next(error);
  }
});

router.post("/verify/credential", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credentialId, proof } = req.body;

    const validatedProof = proofSchema.parse(proof);

    const result = await zkIdentityService.verifyCredential(credentialId, validatedProof);

    res.json({
      success: true,
      verification: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/prove/mock", siweAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schema, extraData } = req.body;

    const schemaMap: Record<string, string> = {
      AGENT_VERIFICATION: SCHEMA_HASHES.AGENT_VERIFICATION,
      TIER_PROOF: SCHEMA_HASHES.TIER_PROOF,
      SCORE_RANGE: SCHEMA_HASHES.SCORE_RANGE,
      OPERATOR_PROOF: SCHEMA_HASHES.OPERATOR_PROOF,
    };

    const identity = await prisma.zkIdentity.findFirst({
      where: { agentWallet: req.user!.wallet.toLowerCase(), active: true },
    });

    const mockProof = zkIdentityService.generateMockProof(
      req.user!.wallet,
      schemaMap[schema] || schema,
      { commitmentX: identity?.commitmentX, commitmentY: identity?.commitmentY, ...extraData }
    );

    res.json({
      success: true,
      proof: mockProof,
      note: "This is a mock proof for testing. Real proofs require ZK circuit execution.",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/schemas", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      schemas: [
        {
          name: "AGENT_VERIFICATION",
          hash: SCHEMA_HASHES.AGENT_VERIFICATION,
          description: "Proof that an agent is registered and active on VOUCH",
        },
        {
          name: "TIER_PROOF",
          hash: SCHEMA_HASHES.TIER_PROOF,
          description: "Proof of minimum agent tier without revealing exact tier",
        },
        {
          name: "SCORE_RANGE",
          hash: SCHEMA_HASHES.SCORE_RANGE,
          description: "Proof that agent score is within a specified range",
        },
        {
          name: "OPERATOR_PROOF",
          hash: SCHEMA_HASHES.OPERATOR_PROOF,
          description: "Proof of operator identity without revealing wallet address",
        },
      ],
    });
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await zkIdentityService.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

export { router as zkIdentityRouter };
