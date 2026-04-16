import dotenv from "dotenv";

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",

  server: {
    port: parseInt(process.env.PORT || "4000", 10),
    host: process.env.HOST || "0.0.0.0",
  },

  corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],

  database: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/vouch",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  blockchain: {
    chainId: parseInt(process.env.CHAIN_ID || "84532", 10),
    rpcUrl: process.env.RPC_URL || "https://sepolia.base.org",
    usdcAddress: process.env.USDC_ADDRESS || "",
    
    contracts: {
      agentRegistry: process.env.AGENT_REGISTRY_ADDRESS || "",
      reputationEngine: process.env.REPUTATION_ENGINE_ADDRESS || "",
      taskEscrow: process.env.TASK_ESCROW_ADDRESS || "",
      disputeManager: process.env.DISPUTE_MANAGER_ADDRESS || "",
    },
  },

  chainlink: {
    oracleAddress: process.env.CHAINLINK_ORACLE_ADDRESS || "",
    jobId: process.env.CHAINLINK_JOB_ID || "",
    subscriptionId: parseInt(process.env.CHAINLINK_SUBSCRIPTION_ID || "0", 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  siwe: {
    domain: process.env.SIWE_DOMAIN || "localhost",
    statement: process.env.SIWE_STATEMENT || "Sign in to VOUCH Protocol",
  },

  ipfs: {
    gateway: process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs/",
    pinningService: process.env.PINATA_API_URL || "",
    pinningKey: process.env.PINATA_API_KEY || "",
  },

  email: {
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "noreply@vouch.xyz",
  },

  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || "",
    botToken: process.env.SLACK_BOT_TOKEN || "",
  },

  rateLimit: {
    windowMs: 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },

  kya: {
    apiKeyHeader: "X-VOUCH-API-KEY",
    defaultRateLimit: 60,
    enterpriseRateLimit: 600,
  },
};
