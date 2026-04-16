import { EventEmitter } from "events";
import { logger } from "../utils/logger";
import { prisma } from "../config/database";
import { config } from "../config/env";
import nodemailer from "nodemailer";
import axios from "axios";

interface NotificationPayload {
  type: string;
  recipient: string;
  data: Record<string, unknown>;
  channels: ("email" | "webhook" | "slack")[];
}

class NotificationWorker extends EventEmitter {
  private isRunning = false;
  private queue: NotificationPayload[] = [];
  private interval: NodeJS.Timeout | null = null;

  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.interval = setInterval(() => this.processQueue(), 5000);

    this.setupEventListeners();

    logger.info("Notification worker started");
  }

  async stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    logger.info("Notification worker stopped");
  }

  private setupEventListeners() {
    this.on("taskCreated", async (data) => {
      await this.sendNotification({
        type: "TASK_CREATED",
        recipient: data.agentOperator,
        data,
        channels: ["email", "webhook"],
      });
    });

    this.on("taskAccepted", async (data) => {
      await this.sendNotification({
        type: "TASK_ACCEPTED",
        recipient: data.poster,
        data,
        channels: ["email"],
      });
    });

    this.on("taskCompleted", async (data) => {
      await this.sendNotification({
        type: "TASK_COMPLETED",
        recipient: data.poster,
        data,
        channels: ["email", "webhook"],
      });
    });

    this.on("taskFailed", async (data) => {
      await this.sendNotification({
        type: "TASK_FAILED",
        recipient: data.poster,
        data,
        channels: ["email"],
      });
    });

    this.on("disputeRaised", async (data) => {
      await this.sendNotification({
        type: "DISPUTE_RAISED",
        recipient: data.agentOperator,
        data,
        channels: ["email", "webhook", "slack"],
      });
    });

    this.on("scoreUpdated", async (data) => {
      await this.sendNotification({
        type: "SCORE_UPDATED",
        recipient: data.agentOperator,
        data,
        channels: ["email"],
      });
    });

    this.on("anomalyDetected", async (data) => {
      await this.sendNotification({
        type: "ANOMALY_DETECTED",
        recipient: data.agentOperator,
        data,
        channels: ["email", "slack"],
      });
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, 10);

    await Promise.all(
      batch.map(async (notification) => {
        try {
          await this.send(notification);
        } catch (error) {
          logger.error("Error sending notification:", error);
        }
      })
    );
  }

  async sendNotification(notification: NotificationPayload) {
    this.queue.push(notification);
  }

  private async send(notification: NotificationPayload) {
    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case "email":
            await this.sendEmail(notification);
            break;
          case "webhook":
            await this.sendWebhook(notification);
            break;
          case "slack":
            await this.sendSlack(notification);
            break;
        }
      } catch (error) {
        logger.error(`Error sending ${channel} notification:`, error);
      }
    }
  }

  private async sendEmail(notification: NotificationPayload) {
    const templates: Record<string, { subject: string; body: string }> = {
      TASK_CREATED: {
        subject: "New Task Assigned to Your Agent",
        body: `Your agent has been assigned a new task: ${notification.data.taskTitle}`,
      },
      TASK_ACCEPTED: {
        subject: "Task Accepted",
        body: `A task has been accepted by the agent. Task: ${notification.data.taskTitle}`,
      },
      TASK_COMPLETED: {
        subject: "Task Completed Successfully",
        body: `The task "${notification.data.taskTitle}" has been completed with quality score: ${notification.data.qualityScore}`,
      },
      TASK_FAILED: {
        subject: "Task Failed",
        body: `The task "${notification.data.taskTitle}" has failed verification.`,
      },
      DISPUTE_RAISED: {
        subject: "Dispute Raised",
        body: `A dispute has been raised for task "${notification.data.taskTitle}". Reason: ${notification.data.reason}`,
      },
      SCORE_UPDATED: {
        subject: "Agent Score Updated",
        body: `Your agent's score has been updated. New score: ${notification.data.newScore}`,
      },
      ANOMALY_DETECTED: {
        subject: "Anomaly Detected on Your Agent",
        body: `An anomaly has been detected on your agent. Type: ${notification.data.anomalyType}`,
      },
    };

    const template = templates[notification.type];
    if (!template) return;

    await this.transporter.sendMail({
      from: config.email.from,
      to: notification.recipient,
      subject: template.subject,
      text: template.body,
      html: `<p>${template.body}</p>`,
    });

    logger.info(`Email sent to ${notification.recipient}: ${notification.type}`);
  }

  private async sendWebhook(notification: NotificationPayload) {
    const subscriptions = await prisma.webhookSubscription.findMany({
      where: {
        isActive: true,
        events: { has: notification.type },
      },
    });

    for (const sub of subscriptions) {
      try {
        await axios.post(sub.url, {
          type: notification.type,
          data: notification.data,
          timestamp: new Date().toISOString(),
        }, {
          headers: {
            "Content-Type": "application/json",
            "X-VOUCH-Signature": sub.secret || "",
          },
        });
      } catch (error) {
        logger.error(`Webhook delivery failed to ${sub.url}:`, error);
      }
    }
  }

  private async sendSlack(notification: NotificationPayload) {
    if (!config.slack.webhookUrl) return;

    const colorMap: Record<string, string> = {
      TASK_CREATED: "#36a64f",
      TASK_ACCEPTED: "#36a64f",
      TASK_COMPLETED: "#36a64f",
      TASK_FAILED: "#dc3545",
      DISPUTE_RAISED: "#ffc107",
      SCORE_UPDATED: "#17a2b8",
      ANOMALY_DETECTED: "#dc3545",
    };

    try {
      await axios.post(config.slack.webhookUrl, {
        attachments: [
          {
            color: colorMap[notification.type] || "#cccccc",
            title: `VOUCH: ${notification.type.replace(/_/g, " ")}`,
            text: JSON.stringify(notification.data, null, 2),
            footer: "VOUCH Protocol",
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      });
    } catch (error) {
      logger.error("Slack notification failed:", error);
    }
  }
}

export const notificationWorker = new NotificationWorker();
