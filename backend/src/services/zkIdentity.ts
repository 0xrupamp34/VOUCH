import { prisma } from "../config/database";
import { blockchainService } from "./blockchain";
import { logger } from "../utils/logger";
import crypto from "crypto";

interface IdentityCommitment {
  secretHash: string;
  nullifierHash: string;
  commitment: [string, string];
  timestamp: Date;
}

interface ZKProof {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  pubSignals: string[];
}

interface ZKCredential {
  credentialId: string;
  schemaHash: string;
  issuedAt: Date;
  expiresAt: Date;
  revoked: boolean;
}

const SCHEMA_HASHES = {
  AGENT_VERIFICATION: "0x" + crypto.createHash("sha256").update("agent_verification").digest("hex"),
  TIER_PROOF: "0x" + crypto.createHash("sha256").update("tier_proof").digest("hex"),
  SCORE_RANGE: "0x" + crypto.createHash("sha256").update("score_range").digest("hex"),
  OPERATOR_PROOF: "0x" + crypto.createHash("sha256").update("operator_proof").digest("hex"),
};

const FIELD_SIZE = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const GENERATOR = BigInt(1);

class ZKIdentityService {
  async registerIdentity(wallet: string): Promise<{
    secret: string;
    nullifier: string;
    commitment: [string, string];
  }> {
    const agent = await prisma.agent.findUnique({
      where: { agentAddr: wallet.toLowerCase() },
    });

    if (!agent) {
      throw new Error("Agent not registered");
    }

    if (!agent.isActive) {
      throw new Error("Agent not active");
    }

    const secret = this.generateSecret();
    const nullifier = this.generateNullifier(wallet, secret);
    const secretHash = this.hashToField(secret);
    const nullifierHash = this.hashToField(nullifier);
    const commitment = this.pedersenCommit(secretHash, nullifierHash);

    await prisma.zkIdentity.create({
      data: {
        agentId: agent.id,
        agentWallet: wallet.toLowerCase(),
        secretHash,
        nullifierHash,
        commitmentX: commitment[0],
        commitmentY: commitment[1],
        nullifierValue: nullifier,
        active: true,
      },
    });

    logger.info(`ZK Identity registered for ${wallet}`);

    return {
      secret,
      nullifier,
      commitment,
    };
  }

  async proveAgentTier(
    wallet: string,
    minTier: number,
    proof: ZKProof
  ): Promise<{ valid: boolean; tier: number }> {
    const identity = await prisma.zkIdentity.findFirst({
      where: { agentWallet: wallet.toLowerCase(), active: true },
    });

    if (!identity) {
      throw new Error("Identity not registered");
    }

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: wallet.toLowerCase() },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    const tierOrder = ["UNRANKED", "BRONZE", "SILVER", "GOLD", "PLATINUM"];
    const actualTier = tierOrder.indexOf(agent.tier);

    if (actualTier < minTier) {
      return { valid: false, tier: actualTier };
    }

    const isValid = this.verifyProof(proof, identity.commitmentX, identity.commitmentY, SCHEMA_HASHES.TIER_PROOF);

    return {
      valid: isValid && actualTier >= minTier,
      tier: actualTier,
    };
  }

  async proveAgentScore(
    wallet: string,
    minScore: number,
    maxScore: number,
    proof: ZKProof
  ): Promise<{ valid: boolean; score: number }> {
    const identity = await prisma.zkIdentity.findFirst({
      where: { agentWallet: wallet.toLowerCase(), active: true },
    });

    if (!identity) {
      throw new Error("Identity not registered");
    }

    const agent = await prisma.agent.findUnique({
      where: { agentAddr: wallet.toLowerCase() },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    const inRange = agent.ewmaScore >= minScore && agent.ewmaScore <= maxScore;
    const isValid = this.verifyProof(proof, identity.commitmentX, identity.commitmentY, SCHEMA_HASHES.SCORE_RANGE);

    return {
      valid: isValid && inRange,
      score: agent.ewmaScore,
    };
  }

  async issueCredential(
    wallet: string,
    schemaHash: string,
    expiresInDays: number
  ): Promise<{ credentialId: string; nullifier: string }> {
    const identity = await prisma.zkIdentity.findFirst({
      where: { agentWallet: wallet.toLowerCase(), active: true },
    });

    if (!identity) {
      throw new Error("Identity not registered");
    }

    const nullifier = this.generateNullifier(wallet, identity.nullifierValue + schemaHash);
    const nullifierHash = this.hashToField(nullifier);

    const credentialId = this.generateCredentialId(wallet, schemaHash, nullifierHash);

    await prisma.zkCredential.create({
      data: {
        credentialId,
        agentWallet: wallet.toLowerCase(),
        schemaHash,
        nullifierHash,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        revoked: false,
      },
    });

    logger.info(`ZK Credential issued for ${wallet}`, { credentialId, schemaHash });

    return {
      credentialId,
      nullifier,
    };
  }

  async revokeCredential(credentialId: string, wallet: string): Promise<boolean> {
    const credential = await prisma.zkCredential.findFirst({
      where: { credentialId, agentWallet: wallet.toLowerCase() },
    });

    if (!credential) {
      throw new Error("Credential not found");
    }

    await prisma.zkCredential.update({
      where: { id: credential.id },
      data: { revoked: true },
    });

    logger.info(`ZK Credential revoked: ${credentialId}`);

    return true;
  }

  async verifyCredential(credentialId: string, proof: ZKProof): Promise<{
    valid: boolean;
    schemaHash: string;
    expired: boolean;
    revoked: boolean;
  }> {
    const credential = await prisma.zkCredential.findFirst({
      where: { credentialId },
    });

    if (!credential) {
      return {
        valid: false,
        schemaHash: "",
        expired: false,
        revoked: false,
      };
    }

    const expired = new Date() > credential.expiresAt;
    const revoked = credential.revoked;

    const nullifierMatches = proof.pubSignals[0] === credential.nullifierHash;

    return {
      valid: !expired && !revoked && nullifierMatches,
      schemaHash: credential.schemaHash,
      expired,
      revoked,
    };
  }

  async getIdentity(wallet: string): Promise<{
    exists: boolean;
    registeredAt: Date | null;
    active: boolean;
  }> {
    const identity = await prisma.zkIdentity.findFirst({
      where: { agentWallet: wallet.toLowerCase() },
    });

    if (!identity) {
      return { exists: false, registeredAt: null, active: false };
    }

    return {
      exists: true,
      registeredAt: identity.createdAt,
      active: identity.active,
    };
  }

  async getCredentials(wallet: string): Promise<any[]> {
    const credentials = await prisma.zkCredential.findMany({
      where: { agentWallet: wallet.toLowerCase() },
      orderBy: { issuedAt: "desc" },
    });

    return credentials.map((c) => ({
      credentialId: c.credentialId,
      schemaHash: c.schemaHash,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      revoked: c.revoked,
      expired: new Date() > c.expiresAt,
    }));
  }

  private generateSecret(): string {
    return "0x" + crypto.randomBytes(31).toString("hex");
  }

  private generateNullifier(wallet: string, entropy: string): string {
    return "0x" + crypto
      .createHash("sha256")
      .update(wallet + entropy)
      .digest("hex");
  }

  private hashToField(value: string): string {
    const hash = crypto.createHash("sha256").update(value).digest("hex");
    const num = BigInt("0x" + hash) % FIELD_SIZE;
    return num.toString();
  }

  private pedersenCommit(secretHash: string, nullifierHash: string): [string, string] {
    const x = BigInt(secretHash);
    const y = BigInt(nullifierHash);

    const px = (x * GENERATOR) % FIELD_SIZE;
    const py = (y * GENERATOR * BigInt(2)) % FIELD_SIZE;

    return [
      px.toString(),
      py.toString(),
    ];
  }

  private generateCredentialId(wallet: string, schemaHash: string, nullifierHash: string): string {
    return "0x" + crypto
      .createHash("sha256")
      .update(wallet + schemaHash + nullifierHash)
      .digest("hex");
  }

  private verifyProof(
    proof: ZKProof,
    commitmentX: string,
    commitmentY: string,
    schemaHash: string
  ): boolean {
    if (!proof.pubSignals || proof.pubSignals.length < 2) {
      return false;
    }

    if (!proof.a || !proof.b || !proof.c) {
      return false;
    }

    return true;
  }

  generateMockProof(
    wallet: string,
    schemaHash: string,
    extraData?: any
  ): ZKProof {
    const nullifierHash = this.hashToField(this.generateNullifier(wallet, schemaHash));

    return {
      a: [
        this.hashToField(crypto.randomBytes(32).toString("hex")),
        this.hashToField(crypto.randomBytes(32).toString("hex")),
      ],
      b: [
        [
          this.hashToField(crypto.randomBytes(32).toString("hex")),
          this.hashToField(crypto.randomBytes(32).toString("hex")),
        ],
        [
          this.hashToField(crypto.randomBytes(32).toString("hex")),
          this.hashToField(crypto.randomBytes(32).toString("hex")),
        ],
      ],
      c: [
        this.hashToField(crypto.randomBytes(32).toString("hex")),
        this.hashToField(crypto.randomBytes(32).toString("hex")),
      ],
      pubSignals: [nullifierHash, extraData?.commitmentX || "0", extraData?.commitmentY || "0"],
    };
  }

  async getStats(): Promise<{
    totalIdentities: number;
    totalCredentials: number;
    totalRevoked: number;
    totalActive: number;
  }> {
    const [identities, credentials] = await Promise.all([
      prisma.zkIdentity.findMany({ where: { active: true } }),
      prisma.zkCredential.findMany(),
    ]);

    const revoked = credentials.filter((c) => c.revoked).length;

    return {
      totalIdentities: identities.length,
      totalCredentials: credentials.length,
      totalRevoked: revoked,
      totalActive: identities.filter((i) => i.active).length,
    };
  }
}

export const zkIdentityService = new ZKIdentityService();
export { SCHEMA_HASHES, ZKProof, ZKCredential };
