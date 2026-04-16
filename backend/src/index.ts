import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { rateLimit } from "express-rate-limit";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./utils/errors";
import { prisma } from "./config/database";
import { redis } from "./config/redis";
import { apolloServer } from "./api/graphql";
import { authRouter } from "./api/routes/auth";
import { agentsRouter } from "./api/routes/agents";
import { tasksRouter } from "./api/routes/tasks";
import { disputesRouter } from "./api/routes/disputes";
import { kyaRouter } from "./api/routes/kya";
import { webhooksRouter } from "./api/routes/webhooks";
import { adminRouter } from "./api/routes/admin";
import { mcpRouter } from "./api/routes/mcp";
import { a2aRouter } from "./api/routes/a2a";
import { insuranceRouter } from "./api/routes/insurance";
import { complianceRouter } from "./api/routes/compliance";
import { disputeAIRouter } from "./api/routes/disputeAI";
import { crossChainRouter } from "./api/routes/crossChain";
import { enterpriseKyaRouter } from "./api/routes/enterpriseKYA";
import { zkIdentityRouter } from "./api/routes/zkIdentity";
import { verificationWorker } from "./workers/verification";
import { notificationWorker } from "./workers/notifications";
import { anomalyDetectionWorker } from "./workers/anomalyDetection";

const app: Express = express();
const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.use(morgan("combined", {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

app.get("/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisStatus = redis.status === "ready" ? "connected" : "disconnected";
    
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        redis: redisStatus,
        api: "operational",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: (error as Error).message,
    });
  }
});

app.get("/ready", (req: Request, res: Response) => {
  res.json({ ready: true });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/agents", agentsRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/disputes", disputesRouter);
app.use("/api/v1/kya", kyaRouter);
app.use("/api/v1/webhooks", webhooksRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1", mcpRouter);
app.use("/api/v1", a2aRouter);
app.use("/api/v1/insurance", insuranceRouter);
app.use("/api/v1/compliance", complianceRouter);
app.use("/api/v1/dispute-ai", disputeAIRouter);
app.use("/api/v1/cross-chain", crossChainRouter);
app.use("/api/v1/enterprise", enterpriseKyaRouter);
app.use("/api/v1/zk-identity", zkIdentityRouter);

apolloServer.applyMiddleware({ app, path: "/graphql" });

wss.on("connection", (ws: WebSocket) => {
  logger.info("WebSocket client connected");

  ws.on("message", async (message: string) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === "subscribe") {
        const { channel, id } = data;
        ws.send(JSON.stringify({
          type: "subscribed",
          channel,
          id,
        }));
      }
    } catch (error) {
      logger.error("WebSocket message error:", error);
    }
  });

  ws.on("close", () => {
    logger.info("WebSocket client disconnected");
  });

  ws.on("error", (error) => {
    logger.error("WebSocket error:", error);
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startWorkers() {
  logger.info("Starting background workers...");
  
  verificationWorker.start();
  notificationWorker.start();
  anomalyDetectionWorker.start();
  
  logger.info("Background workers started");
}

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  verificationWorker.stop();
  notificationWorker.stop();
  anomalyDetectionWorker.stop();
  
  await prisma.$disconnect();
  await redis.quit();
  
  httpServer.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

async function main() {
  try {
    logger.info("Connecting to database...");
    await prisma.$connect();
    logger.info("Database connected");

    logger.info("Connecting to Redis...");
    await redis.connect();
    logger.info("Redis connected");

    await startWorkers();

    httpServer.listen(config.port, () => {
      logger.info(`🚀 VOUCH Backend running on port ${config.port}`);
      logger.info(`📊 GraphQL endpoint: http://localhost:${config.port}/graphql`);
      logger.info(`🔌 WebSocket endpoint: ws://localhost:${config.port}/ws`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();

export { app, httpServer };
