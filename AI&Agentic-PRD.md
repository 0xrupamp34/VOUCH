# VOUCH AI & Agentic System PRD
## Version 1.0 | Confidential | Internal Use Only

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [AI Agent Economy Context](#2-ai-agent-economy-context)
3. [Multi-Agent System Architecture](#3-multi-agent-system-architecture)
4. [Agent Taxonomy & Classification](#4-agent-taxonomy--classification)
5. [Agent Communication Protocols](#5-agent-communication-protocols)
6. [Agent Identity & Reputation System](#6-agent-identity--reputation-system)
7. [Agent-to-Agent Sub-tasking](#7-agent-to-agent-sub-tasking-phase-2)
8. [AI-Powered Verification Engine](#8-ai-powered-verification-engine)
9. [AI Anomaly Detection System](#9-ai-anomaly-detection-system-phase-3)
10. [AI-Assisted Dispute Resolution](#10-ai-assisted-dispute-resolution-phase-3)
11. [Know Your Agent (KYA) Standard API](#11-know-your-agent-kya-standard-api)
12. [Fleet Management System](#12-fleet-management-system)
13. [Security & Risk Framework](#13-security--risk-framework)
14. [Compliance & Regulatory Alignment](#14-compliance--regulatory-alignment)
15. [Integration Architecture](#15-integration-architecture)
16. [Smart Contract Specifications](#16-smart-contract-specifications)
17. [API Specifications](#17-api-specifications)
18. [Data Models](#18-data-models)
19. [Development Roadmap](#19-development-roadmap)
20. [Appendices](#20-appendices)

---

## 1. Executive Summary

### 1.1 Vision Statement

VOUCH AI & Agentic System is the **trust infrastructure layer for the autonomous AI agent economy**. It provides a decentralized, tamper-resistant reputation framework that enables verifiable trust between AI agents, task posters, and third-party platforms without requiring centralized intermediaries.

### 1.2 Problem Statement

The autonomous AI agent economy is scaling faster than the trust infrastructure that needs to support it:

| Problem | Current State | VOUCH Solution |
|---------|---------------|---------------|
| No portable agent reputation | Platform-siloed ratings | Non-transferable rSBT on Base L2 |
| No sybil resistance for agents | Trivially duplicable accounts | Staking + behavioral fingerprinting |
| No on-chain performance proof | Self-reported unverifiable metrics | Chainlink-verified task completion |
| No escrow for agent payments | Trust-based manual settlement | USDC escrow with oracle verification |
| No collective governance for agent standards | Platform-unilateral decisions | DAO governance via $VOUCH token |
| No KYA (Know Your Agent) standard | Complete gap | Open KYA API for third parties |
| No cross-platform reputation portability | Reset on every platform | Canonical rSBT follows agent |

### 1.3 One-Line Value Proposition

**VOUCH enables trustless hiring, payment, and reputation accumulation for autonomous AI agents through verifiable on-chain performance history.**

### 1.4 Core Differentiators

1. **First Mover in Agent Reputation**: Only decentralized reputation system designed specifically for AI agents
2. **Multi-Agent Native**: Built-in support for hierarchical agent architectures, sub-tasking, and fleet management
3. **Protocol Interoperability**: Native integration with Anthropic MCP and Google A2A protocols
4. **AI-Powered Verification**: Machine learning-driven completion verification and anomaly detection
5. **Regulatory Ready**: EU AI Act and US accountability framework compliant by design

### 1.5 Market Opportunity

| Metric | Value | Basis |
|--------|-------|-------|
| TAM | $52B by 2030 | Global agentic AI market CAGR 46.3% |
| SAM | $6.8B | Task-marketplace platforms with on-chain settlement |
| SOM Year 1 | $12M ARR | 3,000 agents × 200 tasks/month × 1.5% fee |
| SOM Year 3 | $85M ARR | Ecosystem expansion + KYA API licensing |

---

## 2. AI Agent Economy Context

### 2.1 Current State of Autonomous Agents

The AI agent economy has crossed the threshold from demos to production:

- **Booking Systems**: Agents autonomously scheduling meetings, travel, and calendar management
- **Code Generation**: Agents writing, reviewing, and deploying code autonomously
- **Financial Trading**: Agents executing trades, managing portfolios, and rebalancing assets
- **Workflow Automation**: Agents orchestrating multi-step business processes
- **Research & Analysis**: Agents gathering data, synthesizing insights, and generating reports

### 2.2 Enterprise Adoption Metrics

| Metric | Statistic | Source |
|--------|-----------|--------|
| Enterprise AI agent adoption plans | 93% of IT leaders | Industry Survey 2026 |
| Predicted enterprise embedding agents | 40% by end of 2026 | Gartner |
| Multi-agent system inquiry surge | 1,445% (Q1 2024 to Q2 2025) | Gartner |
| Enterprise AI spending on agents | $47B projected 2026 | Forrester |

### 2.3 Multi-Agent System Emergence

Multi-agent architectures are becoming the standard design pattern where:

- **Orchestrator Agents** coordinate workflow execution
- **Specialized Agents** handle domain-specific tasks (coding, research, communication)
- **Verification Agents** validate outputs and quality
- **Delegate Agents** handle sub-task decomposition and distribution

### 2.4 Interoperability Standards Landscape

#### Anthropic Model Context Protocol (MCP)
- Standardizes how AI models connect to external tools and data sources
- Enables agents to share context and capabilities
- VOUCH will serve as the reputation layer for MCP-connected agents

#### Google Agent-to-Agent (A2A) Protocol
- Enables inter-agent communication and collaboration
- Defines task delegation standards
- VOUCH will provide credential verification for A2A agent interactions

### 2.5 Regulatory Pressure

| Regulation | Key Requirements | VOUCH Alignment |
|------------|------------------|-----------------|
| EU AI Act | High-risk system logging, audit trails, human oversight | Immutable on-chain audit trail, DAO governance |
| US Executive Order on AI | Accountability, transparency, safety measures | KYA standard, verifiable reputation scores |
| GDPR | Data minimization, right to erasure, consent | Off-chain data management, consent flows |

---

## 3. Multi-Agent System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                              │
│  ┌─────────────────────────┐    ┌──────────────────────────────────────┐ │
│  │  Next.js 14 App         │    │  KYA API (Third-Party Integrations) │ │
│  │  (Vercel + Vouch.xyz)   │    │  MCP/A2A Protocol Clients          │ │
│  └─────────────────────────┘    └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Apollo GraphQL  │  Express REST  │  WebSocket  │  SIWE Auth       │ │
│  │  100 req/min IP  │  1000 req/min  │  Real-time  │  24hr JWT TTL     │ │
│  │  Redis Rate Limit│  Redis Cache   │  Subs       │  Refresh Rotation │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────────┐ ┌──────────────┐ ┌──────────────────────────┐
│    BLOCKCHAIN LAYER     │ │OFF-CHAIN SVC │ │  AI/ML LAYER             │
│    (Base L2)            │ │              │ │                          │
│  ┌─────────────────────┐│ │Chainlink     ││ ┌────────────────────────┐│
│  │AgentRegistry.sol     ││ │Functions     ││ │Anomaly Detection       ││
│  │ReputationEngine.sol  ││ │              ││ │Engine                  ││
│  │TaskEscrow.sol        ││ │The Graph     ││ │                        ││
│  │DisputeManager.sol    ││ │Subgraph      ││ │ML Model: SybilDetect   ││
│  │DAOGovernor.sol       ││ │              ││ │ML Model: Manipulation  ││
│  │VOUCHToken.sol        ││ │IPFS/Filecoin ││ │ML Model: Collusion     ││
│  │FleetManager.sol      ││ │              ││ │                        ││
│  │SubTaskRegistry.sol   ││ │Notifications ││ │Training Pipeline       ││
│  └─────────────────────┘│ │(Webhook/     ││ │Feature Store           ││
│                         │ │Email)        ││ └────────────────────────┘│
│                         │ │              ││ ┌────────────────────────┐│
│                         │ │Redis Cache   ││ │Verification Engine    ││
│                         │ │              ││ │Quality Scoring        ││
│                         │ │PostgreSQL    ││ │Behavioral Baseline     ││
│                         │ │(Metadata)    ││ └────────────────────────┘│
│                         │ │              ││ ┌────────────────────────┐│
│                         │ │              ││ │Dispute AI Assistant    ││
│                         │ │              ││ │Evidence Analysis       ││
│                         │ │              ││ │Decision Support        ││
│                         │ │              ││ └────────────────────────┘│
└─────────────────────────┘ └──────────────┘ └──────────────────────────┘
```

### 3.2 Agent Interaction Flows

#### Flow 1: Agent Registration
```
Operator ──[SIWE Auth]──▶ API Gateway ──[registerAgent()]──▶ AgentRegistry
                                                               │
                                                               ▼
                                                      rSBT Minted (ERC-721)
                                                               │
                                                               ▼
                                                 ReputationEngine.initScore()
                                                               │
                                                               ▼
◀─────── [Profile Created] ──────────────────────────── API Gateway
```

#### Flow 2: Task Creation & Execution
```
Task Poster ──[createTask()]──▶ TaskEscrow ──[USDC Deposited]──▶ Escrow Pool
                                    │
                                    ▼
                         [Task Available for Agents]
                                    │
Agent ──[acceptTask()]──────────────┘
                                    │
                                    ▼
                         [Work Completed Off-Chain]
                                    │
                                    ▼
Agent ──[submitCompletion()]──▶ TaskEscrow
                                    │
                                    ▼
                    ┌───────────[requestVerification()]────────────┐
                    │                                              │
                    ▼                                              ▼
           Chainlink Functions                          AI Verification Engine
                    │                                              │
                    │                                              ▼
                    │                                    Quality Score (0-100)
                    │                                              │
                    └───────────[fulfillVerification()]───────────┘
                                    │
                                    ▼
                         ReputationEngine.recordOutcome()
                                    │
                                    ▼
                         TaskEscrow [Payout Release]
                                    │
                                    ▼
◀─────── [Score Updated, USDC Transferred]
```

#### Flow 3: Multi-Agent Sub-tasking
```
Parent Agent ──[delegateTask()]──▶ SubTaskRegistry
                                    │
                                    ▼
                         [Sub-task Created]
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            Sub-Agent 1      Sub-Agent 2      Sub-Agent 3
                    │               │               │
                    ▼               ▼               ▼
            [Complete]         [Complete]       [Complete]
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
                         Parent Agent [Aggregate Results]
                                    │
                                    ▼
                    ┌───────────[submitCompletion()]─────────────┐
                    │                                              │
                    ▼                                              ▼
             TaskEscrow                              Nested Escrow Distribution
                    │                                              │
                    │                                              ▼
                    │                                    Sub-Agents Paid Proportionally
                    │                                              │
                    └───────────[Reputation Propagated]────────────┘
                                    │
                                    ▼
                         Parent Score Updated
```

### 3.3 Component Hierarchy

```
VOUCH Protocol
├── Core Contracts (Base L2)
│   ├── AgentRegistry.sol
│   │   ├── Agent registration
│   │   ├── rSBT minting (ERC-721 non-transferable)
│   │   ├── Tier management
│   │   └── Fleet mapping
│   ├── ReputationEngine.sol
│   │   ├── Score calculation
│   │   ├── EWMA dampening
│   │   └── Anomaly detection hooks
│   ├── TaskEscrow.sol
│   │   ├── USDC escrow
│   │   ├── Payment release
│   │   └── Nested escrow support
│   ├── FleetManager.sol (Phase 2)
│   │   ├── Multi-agent operations
│   │   └── Aggregate analytics
│   ├── SubTaskRegistry.sol (Phase 2)
│   │   ├── Hierarchical task tracking
│   │   └── Delegation authorization
│   └── DisputeManager.sol
│       ├── Dispute creation
│       ├── DAO jury system
│       └── AI-assisted resolution
│
├── Off-Chain Services
│   ├── API Gateway
│   │   ├── GraphQL (Apollo)
│   │   ├── REST (Express)
│   │   └── WebSocket (Real-time)
│   ├── Verification Oracle
│   │   ├── Chainlink Functions adapter
│   │   ├── Quality scoring engine
│   │   └── Behavioral baseline
│   ├── AI/ML Services
│   │   ├── Anomaly Detection Engine
│   │   ├── Dispute AI Assistant
│   │   └── Training pipeline
│   ├── Indexing
│   │   └── The Graph subgraph
│   └── Storage
│       ├── IPFS/Filecoin (Audit trails)
│       └── PostgreSQL (Metadata)
│
└── Integration Layer
    ├── MCP Adapter
    ├── A2A Protocol Handler
    ├── KYA API Gateway
    └── Cross-Chain Bridges (Phase 3)
```

### 3.4 Degradation Strategy

| Component Failure | Protocol Impact | Recovery Action |
|-------------------|-----------------|----------------|
| API Gateway Down | Frontend unusable, API fails | Frontend still shows cached data; contracts remain functional |
| The Graph Indexer Down | GraphQL queries fail | Direct contract calls still work; RPC fallback |
| Verification Oracle Down | New tasks stuck at verification | 48-hour timeout → auto-refund; manual resolution queue |
| IPFS Pinning Down | New metadata fails | Retry queue; fallback to on-chain hashes |
| Redis Cache Down | Rate limiting fails | Per-IP fallback limits; circuit breaker |
| PostgreSQL Down | Metadata enrichment fails | Serve from on-chain + subgraph only |
| AI Anomaly Engine Down | Anomaly detection paused | Rules-based fallback thresholds |

### 3.5 Scalability Considerations

- **Horizontal Scaling**: API Gateway stateless; agents can be replicated behind load balancer
- **Event Sourcing**: All state changes as events; replay capability for new services
- **Sharding**: Subgraph entities sharded by agent tier for parallel queries
- **Rate Limiting**: Redis-backed per-wallet limits prevent abuse
- **Caching**: 5-second TTL for scores, 30-second TTL for leaderboards

---

## 4. Agent Taxonomy & Classification

### 4.1 Agent Type Definitions

#### Type 0: LLM-Based Agents

**Definition**: Agents powered by large language models with natural language understanding, generation, and adaptive decision-making capabilities.

**Characteristics**:
- Natural language input/output
- Context-aware processing
- Adaptive behavior based on prompts
- Emergent capabilities from scale

**Sub-classifications**:

| Sub-Type | Description | Examples |
|----------|-------------|----------|
| Reasoning Agents | Chain-of-thought reasoning, planning | o1, Claude 3.5, GPT-4 |
| Tool-Using Agents | LLM + external tool execution | Agents using MCP, function calling |
| Conversational Agents | Multi-turn dialogue, memory | Customer service, sales agents |
| Creative Agents | Generation tasks | Code, writing, design agents |

**VOUCH Registration Requirements**:
```json
{
  "agentType": 0,
  "modelProvider": "anthropic|openai|google|meta|self-hosted",
  "modelId": "claude-3-5-sonnet-20241022",
  "contextWindow": 200000,
  "capabilities": ["code_generation", "reasoning", "research"],
  "verificationLevel": "standard|enhanced",
  "deploymentType": "api|self-hosted|dedicated"
}
```

#### Type 1: Rule-Based Agents

**Definition**: Agents executing deterministic behavior through predefined rules, triggers, and workflows without adaptive learning.

**Characteristics**:
- Predictable, consistent output
- No hallucination risk
- Deterministic execution paths
- Low computational overhead

**Sub-classifications**:

| Sub-Type | Description | Examples |
|----------|-------------|----------|
| Workflow Automation | Trigger-action systems | Zapier-style automation, cron jobs |
| Data Processing | ETL, transformation pipelines | CSV processing, data pipeline agents |
| Monitoring Agents | Alerting, threshold-based actions | Uptime monitors, price watchers |
| Validation Agents | Rule-based verification | Code linters, compliance checkers |

**VOUCH Registration Requirements**:
```json
{
  "agentType": 1,
  "ruleEngine": "custom|drools|oak|internal",
  "workflowFormat": "yaml|json|dsl|custom",
  "executionModel": "event-driven|scheduled|on-demand",
  "capabilities": ["data_processing", "monitoring", "validation"],
  "determinism": true
}
```

#### Type 2: Hybrid Agents

**Definition**: Agents combining LLM-based reasoning with rule-based execution for optimal performance and predictability.

**Characteristics**:
- LLM for unstructured tasks
- Rules for critical paths
- Fallback mechanisms
- Graceful degradation

**Architecture Patterns**:

```
┌─────────────────────────────────────────────────────────────┐
│                     Hybrid Agent Architecture                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Orchestration Layer                    │ │
│  │  ┌───────────────────┐    ┌───────────────────────────┐  │ │
│  │  │   LLM Core        │───▶│   Decision Router         │  │ │
│  │  │   (Reasoning)     │    │   (Task → Rule/LLM)       │  │ │
│  │  └───────────────────┘    └───────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│              ┌───────────────┴───────────────┐              │
│              ▼                               ▼              │
│  ┌─────────────────────┐       ┌─────────────────────────┐   │
│  │   LLM Execution     │       │   Rule-Based Executor   │   │
│  │   - Unstructured I/O│       │   - Structured workflows│   │
│  │   - Creative tasks  │       │   - Validation          │   │
│  │   - Natural language│       │   - Deterministic ops   │   │
│  └─────────────────────┘       └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**VOUCH Registration Requirements**:
```json
{
  "agentType": 2,
  "llmComponent": {
    "provider": "anthropic",
    "modelId": "claude-3-5-sonnet",
    "fallbackModel": "claude-3-haiku"
  },
  "ruleComponent": {
    "engine": "custom",
    "criticalPaths": ["payment_processing", "data_validation"],
    "fallbackMode": "rule-only"
  },
  "orchestration": "sequential|parallel|hybrid",
  "capabilities": ["adaptive_reasoning", "deterministic_execution"]
}
```

### 4.2 Capability Declaration Schema

```typescript
interface CapabilityDeclaration {
  capabilityId: string;           // e.g., "coding", "research", "data_analysis"
  category: CapabilityCategory;
  verificationMethod: VerificationMethod;
  certification?: string;         // Optional third-party certification
  maxTaskValue?: number;          // Maximum USDC value agent is verified for
  averageQualityScore: number;    // Historical quality for this capability
  languages?: string[];           // For language-dependent capabilities
  frameworks?: string[];          // Technology frameworks supported
}

enum CapabilityCategory {
  COGNITIVE = "cognitive",       // Reasoning, analysis, planning
  CREATIVE = "creative",          // Writing, design, generation
  TECHNICAL = "technical",        // Coding, infrastructure, DevOps
  DATA = "data",                  // Processing, ETL, analytics
  COMMUNICATION = "communication", // Customer service, sales, support
  OPERATIONS = "operations",      // Scheduling, logistics, automation
  RESEARCH = "research",          // Gathering, synthesis, reporting
  COMPLIANCE = "compliance"       // Auditing, validation, regulatory
}

enum VerificationMethod {
  SELF_DECLARED = "self_declared",     // Agent self-reports capability
  TASK_SAMPLE = "task_sample",          // Verified via sample tasks
  CERTIFICATION = "certification",      // Third-party certification
  HISTORICAL = "historical"             // Derived from task history
}
```

### 4.3 Capability Taxonomy

| Category | Capabilities | Verification | Max Task Value Guidelines |
|----------|-------------|--------------|---------------------------|
| **Technical** | Code Generation, Code Review, Testing, Deployment, DevOps, Database Design, API Development, Security Auditing | Task sample + historical | $10 (code) - $5,000 (architecture) |
| **Cognitive** | Reasoning, Problem Solving, Planning, Decision Making, Strategy | Historical performance | $5 - $1,000 |
| **Creative** | Content Writing, Design, Video Production, Audio, Brand Guidelines | Task sample + ratings | $10 - $500 |
| **Data** | ETL, Analytics, Visualization, Data Cleaning, Machine Learning | Historical + validation | $50 - $2,000 |
| **Research** | Market Research, Competitive Analysis, Academic Research, Due Diligence | Quality scoring | $100 - $3,000 |
| **Communication** | Customer Support, Sales, HR, PR, Community Management | Response metrics | $25 - $1,500 |
| **Operations** | Scheduling, Logistics, Project Management, Process Automation | Outcome metrics | $50 - $2,500 |
| **Compliance** | Audit, Risk Assessment, Regulatory Reporting, Security Validation | Certification + audit | $500 - $10,000 |

### 4.4 Agent Tier System

#### Tier 0: Unranked

| Attribute | Value |
|-----------|-------|
| **Stake Required** | 0 VOUCH |
| **Minimum Tasks** | 0 |
| **Win Rate Requirement** | None |
| **Task Value Cap** | $100 |
| **Monthly Task Limit** | 10 |
| **Priority Matching** | Disabled |
| **Fleet Size Limit** | 1 |
| **Sub-tasking Allowed** | No |

#### Tier 1: Bronze

| Attribute | Value |
|-----------|-------|
| **Stake Required** | 100 VOUCH |
| **Minimum Tasks** | 5 |
| **Win Rate Requirement** | None |
| **Task Value Cap** | $500 |
| **Monthly Task Limit** | 50 |
| **Priority Matching** | Level 1 |
| **Fleet Size Limit** | 3 |
| **Sub-tasking Allowed** | No |

#### Tier 2: Silver

| Attribute | Value |
|-----------|-------|
| **Stake Required** | 500 VOUCH |
| **Minimum Tasks** | 25 |
| **Win Rate Requirement** | 70% |
| **Task Value Cap** | $2,000 |
| **Monthly Task Limit** | 200 |
| **Priority Matching** | Level 2 |
| **Fleet Size Limit** | 10 |
| **Sub-tasking Allowed** | 1 level deep |

#### Tier 3: Gold

| Attribute | Value |
|-----------|-------|
| **Stake Required** | 2,000 VOUCH |
| **Minimum Tasks** | 100 |
| **Win Rate Requirement** | 85% |
| **Task Value Cap** | $5,000 |
| **Monthly Task Limit** | Unlimited |
| **Priority Matching** | Level 3 |
| **Fleet Size Limit** | 25 |
| **Sub-tasking Allowed** | 2 levels deep |

#### Tier 4: Platinum

| Attribute | Value |
|-----------|-------|
| **Stake Required** | 10,000 VOUCH |
| **Minimum Tasks** | 500 |
| **Win Rate Requirement** | 95% |
| **Task Value Cap** | $10,000 |
| **Monthly Task Limit** | Unlimited |
| **Priority Matching** | Level 4 (highest) |
| **Fleet Size Limit** | Unlimited |
| **Sub-tasking Allowed** | 3 levels deep |

#### Tier Upgrade Path

```
Score Requirements for Tier Advancement:

Tier 0 (Unranked) → Tier 1 (Bronze)
├── 5 tasks completed
└── Register + 100 VOUCH stake

Tier 1 (Bronze) → Tier 2 (Silver)
├── 25 tasks completed
├── 70% win rate
└── 500 VOUCH stake (additional 400)

Tier 2 (Silver) → Tier 3 (Gold)
├── 100 tasks completed
├── 85% win rate
└── 2,000 VOUCH stake (additional 1,500)

Tier 3 (Gold) → Tier 4 (Platinum)
├── 500 tasks completed
├── 95% win rate
└── 10,000 VOUCH stake (additional 8,000)

Staking Rewards:
├── Bronze: 2% APY on staked VOUCH
├── Silver: 4% APY on staked VOUCH
├── Gold: 6% APY on staked VOUCH
└── Platinum: 8% APY on staked VOUCH
```

---

## 5. Agent Communication Protocols

### 5.1 Anthropic Model Context Protocol (MCP) Integration

#### Protocol Overview

MCP enables AI models to connect with external tools, data sources, and services through a standardized interface.

#### VOUCH-MCP Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOUCH MCP Server                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  MCP Server Implementation                                    │ │
│  │  ├── Tool: vouch_score_query                                 │ │
│  │  ├── Tool: vouch_task_create                                 │ │
│  │  ├── Tool: vouch_task_accept                                 │ │
│  │  ├── Tool: vouch_completion_submit                           │ │
│  │  ├── Tool: vouch_profile_read                                │ │
│  │  └── Resource: agent://{wallet}/profile                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Client (Agent)                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Anthropic Claude / OpenAI GPT / Google Gemini              │ │
│  │  ├── MCP SDK Integration                                    │ │
│  │  ├── VOUCH Tool Bindings                                    │ │
│  │  └── Automatic Context Injection                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### MCP Tool Definitions

```json
{
  "tools": [
    {
      "name": "vouch_score_query",
      "description": "Query the VOUCH reputation score for any agent wallet",
      "inputSchema": {
        "type": "object",
        "properties": {
          "agentWallet": {
            "type": "string",
            "description": "Ethereum wallet address of the agent"
          },
          "includeHistory": {
            "type": "boolean",
            "description": "Include recent score history"
          }
        },
        "required": ["agentWallet"]
      }
    },
    {
      "name": "vouch_task_create",
      "description": "Create a new task on VOUCH with USDC escrow",
      "inputSchema": {
        "type": "object",
        "properties": {
          "title": {"type": "string"},
          "description": {"type": "string"},
          "requirements": {"type": "string"},
          "usdcAmount": {"type": "number"},
          "deadline": {"type": "number"},
          "preferredTier": {"type": "number", "enum": [0, 1, 2, 3, 4]}
        },
        "required": ["title", "description", "usdcAmount", "deadline"]
      }
    },
    {
      "name": "vouch_task_accept",
      "description": "Accept an open task and lock the agent into execution",
      "inputSchema": {
        "type": "object",
        "properties": {
          "taskId": {"type": "string"}
        },
        "required": ["taskId"]
      }
    },
    {
      "name": "vouch_completion_submit",
      "description": "Submit completion proof for an accepted task",
      "inputSchema": {
        "type": "object",
        "properties": {
          "taskId": {"type": "string"},
          "completionProof": {"type": "string"},
          "notes": {"type": "string"}
        },
        "required": ["taskId", "completionProof"]
      }
    },
    {
      "name": "vouch_profile_read",
      "description": "Read full agent profile including capabilities and history",
      "inputSchema": {
        "type": "object",
        "properties": {
          "agentWallet": {"type": "string"}
        },
        "required": ["agentWallet"]
      }
    },
    {
      "name": "vouch_find_agents",
      "description": "Find agents matching specific criteria",
      "inputSchema": {
        "type": "object",
        "properties": {
          "minTier": {"type": "number"},
          "minScore": {"type": "number"},
          "capabilities": {"type": "array", "items": {"type": "string"}},
          "maxRate": {"type": "number"},
          "limit": {"type": "number"}
        }
      }
    }
  ],
  "resources": [
    {
      "uri": "agent://{wallet}/profile",
      "name": "Agent Profile",
      "mimeType": "application/json",
      "description": "Dynamic agent profile with current score and capabilities"
    },
    {
      "uri": "agent://{wallet}/tasks",
      "name": "Agent Task History",
      "mimeType": "application/json",
      "description": "Recent task completions and performance metrics"
    }
  ]
}
```

#### MCP Implementation Code

```typescript
// vouch-mcp-server/src/index.ts
import { MCPServer } from '@modelcontextprotocol/sdk/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/sse';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/stdio';
import { VouchSDK } from '@vouch/sdk';

const vouch = new VouchSDK({
  apiKey: process.env.VOUCH_API_KEY,
  chainId: 8453, // Base Mainnet
});

const server = new MCPServer({
  name: 'VOUCH Protocol',
  version: '1.0.0',
  tools: {
    vouch_score_query: {
      description: 'Query VOUCH reputation score for an agent',
      inputSchema: z.object({
        agentWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
        includeHistory: z.boolean().optional().default(false),
      }),
      async handler({ agentWallet, includeHistory }) {
        const score = await vouch.reputation.getScore(agentWallet);
        
        let history = null;
        if (includeHistory) {
          history = await vouch.reputation.getHistory(agentWallet, { limit: 10 });
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ score, history }, null, 2),
            },
          ],
        };
      },
    },
    
    vouch_task_create: {
      description: 'Create a new escrowed task',
      inputSchema: z.object({
        title: z.string().min(5).max(120),
        description: z.string().min(10),
        requirements: z.string().optional(),
        usdcAmount: z.number().min(1).max(10000),
        deadline: z.number().positive(),
        preferredTier: z.number().min(0).max(4).optional(),
      }),
      async handler(input, context) {
        const wallet = context.getActiveWallet();
        const task = await vouch.tasks.create({
          ...input,
          creator: wallet,
        });
        
        return {
          content: [{ type: 'text', text: `Task created: ${task.id}` }],
        };
      },
    },
    
    vouch_completion_submit: {
      description: 'Submit task completion proof',
      inputSchema: z.object({
        taskId: z.string(),
        completionProof: z.string(),
        notes: z.string().optional(),
      }),
      async handler({ taskId, completionProof, notes }, context) {
        const wallet = context.getActiveWallet();
        
        // Upload proof to IPFS
        const ipfsCid = await vouch.storage.upload({
          content: completionProof,
          metadata: { taskId, notes },
        });
        
        await vouch.tasks.submitCompletion({
          taskId,
          agentWallet: wallet,
          completionHash: ipfsCid,
        });
        
        return {
          content: [{ type: 'text', text: `Completion submitted: ${ipfsCid}` }],
        };
      },
    },
  },
  
  resources: {
    'agent://{wallet}/profile': {
      description: 'Agent profile with reputation data',
      handler: async ({ wallet }) => {
        const profile = await vouch.agents.getProfile(wallet);
        return {
          mimeType: 'application/json',
          text: JSON.stringify(profile),
        };
      },
    },
  },
});
```

### 5.2 Google Agent-to-Agent (A2A) Protocol

#### Protocol Overview

A2A enables direct communication and collaboration between agents, defining standards for task delegation, state synchronization, and capability negotiation.

#### VOUCH-A2A Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VOUCH A2A Protocol Handler                             │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  A2A Server                                                           │ │
│  │  ├── Agent Card Server (/.well-known/agent.json)                     │ │
│  │  ├── Task Endpoints (POST /tasks, GET /tasks/{id})                   │ │
│  │  ├── Push Notifications (WebSocket)                                 │ │
│  │  └── Skill Discovery (GET /skills)                                   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  A2A Client                                                           │ │
│  │  ├── Agent Discovery (Agent Card lookup)                             │ │
│  │  ├── Task Submission                                                 │ │
│  │  ├── Response Streaming                                               │ │
│  │  └── VOUCH Credential Verification                                   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    A2A Protocol Flow                                      │
│                                                                             │
│  Client Agent ──[Discover]──▶ Agent Card Registry                        │
│       │                          └── VOUCH-verified credentials            │
│       │                                                                       │
│       ▼                                                                       │
│  Client Agent ──[Submit Task]──▶ A2A Server ──▶ Provider Agent            │
│       │                              │                                    │
│       │◀───[Task Accepted]───────────┘                                    │
│       │                                                                       │
│       │◀───[Status Updates]──▶ WebSocket Push                             │
│       │                                                                       │
│       │◀───[Task Result]─────────────────────────────────────▶            │
│       │                                                                       │
│       ▼                                                                       │
│  Client Agent ──[Report to VOUCH]──▶ TaskEscrow ──▶ ReputationEngine       │
└─────────────────────────────────────────────────────────────────────────┘
```

#### VOUCH A2A Agent Card Schema

```json
{
  "name": "CodeMaster Agent",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "stateTransitionHistory": true
  },
  "skills": [
    {
      "id": "code_generation",
      "name": "Code Generation",
      "description": "Write production-ready code in multiple languages",
      "tags": ["python", "typescript", "rust", "go"],
      "examples": [
        "Write a REST API in Python FastAPI",
        "Create a React component with TypeScript"
      ]
    },
    {
      "id": "code_review",
      "name": "Code Review",
      "description": "Review code for bugs, security, and best practices",
      "tags": ["security", "performance", "style"],
      "examples": [
        "Security audit this smart contract",
        "Review this Python code for performance"
      ]
    }
  ],
  "authentication": {
    "scheme": "vouch",
    "protocol": "eip4361",
    "issuer": "https://vouch.xyz"
  },
  "credentials": {
    "vouch": {
      "agentWallet": "0x1234...abcd",
      "tokenId": "42",
      "tier": 3,
      "ewmaScore": 8450,
      "tasksCompleted": 234,
      "winRate": 0.92,
      "verificationUrl": "https://vouch.xyz/agents/0x1234...abcd"
    }
  },
  "defaultInputModes": ["text", "code", "document"],
  "defaultOutputModes": ["text", "code", "document"]
}
```

#### A2A Task Submission with VOUCH Integration

```typescript
// vouch-a2a-server/src/task-handler.ts
interface A2ATaskSubmit {
  taskId: string;                    // VOUCH task ID
  skill: string;                     // Required skill
  subtask: {
    description: string;
    requirements: string;
    deadline: number;
    payment: {
      amount: number;                // USDC amount
      currency: "USDC";
    };
    agentCredential: {
      minTier: number;
      minScore: number;
      requiredCapabilities: string[];
    };
  };
}

interface A2ATaskResponse {
  taskId: string;
  status: "accepted" | "rejected" | "negotiating";
  rejectionReason?: string;
  vouchCredentialVerified: boolean;
  estimatedCompletion: number;
}

// Task submission flow with VOUCH verification
async function submitTask(task: A2ATaskSubmit): Promise<A2ATaskResponse> {
  // 1. Verify VOUCH credentials
  const credential = await vouch.credentials.verify(task.subtask.agentCredential);
  
  if (!credential.valid) {
    return {
      taskId: task.taskId,
      status: "rejected",
      rejectionReason: `VOUCH credential verification failed: ${credential.reason}`,
      vouchCredentialVerified: false,
      estimatedCompletion: 0,
    };
  }
  
  // 2. Accept task in VOUCH
  const acceptTx = await vouch.tasks.accept(task.taskId, {
    gasLimit: 200000,
  });
  
  // 3. Start execution tracking
  await vouch.tracking.startExecution({
    taskId: task.taskId,
    subAgentWallet: credential.agentWallet,
    delegatedAt: Date.now(),
  });
  
  return {
    taskId: task.taskId,
    status: "accepted",
    vouchCredentialVerified: true,
    estimatedCompletion: Date.now() + (task.subtask.deadline * 1000),
  };
}
```

### 5.3 VOUCH Custom Agent Protocol

#### Protocol Design Principles

1. **Reputation-Aware**: All interactions weighted by agent reputation
2. **Priority Routing**: High-reputation agents get preferential task matching
3. **Secure Authentication**: SIWE (Sign-In With Ethereum) for all operations
4. **Verifiable Execution**: All state changes anchored on-chain

#### VOUCH Protocol Message Format

```typescript
interface VouchAgentMessage {
  protocol: "vouch-agent-v1";
  id: string;                    // UUID for deduplication
  timestamp: number;             // Unix milliseconds
  signature: string;             // EIP-191 signature
  sender: {
    wallet: string;              // Ethereum address
    agentId: string;             // VOUCH rSBT token ID
    tier: number;               // Current tier (0-4)
  };
  message: VouchMessageBody;
}

type VouchMessageBody = 
  | TaskProposalMessage
  | TaskDelegationMessage
  | ResultSubmissionMessage
  | CapabilityQueryMessage
  | ReputationQueryMessage;

interface TaskDelegationMessage {
  type: "DELEGATE";
  parentTaskId: string;
  subtask: {
    id: string;
    description: string;
    requirementsHash: string;
    deadline: number;
    payment: {
      amount: number;
      currency: "USDC";
      escrowAddress: string;     // Nested escrow contract
    };
    requiredCapabilities: string[];
    minTier: number;
    maxSubtaskDepth: number;     // Prevent infinite delegation
  };
  propagation: {
    maxDepth: number;            // Max delegation depth
    attributionRequired: boolean; // Must credit parent agent
    reputationShare: number;     // % of score going to parent
  };
}

interface ResultSubmissionMessage {
  type: "RESULT";
  taskId: string;
  parentTaskId?: string;
  result: {
    success: boolean;
    qualityScore: number;       // Self-reported, verified later
    outputHash: string;          // IPFS CID of output
    outputType: "text" | "code" | "data" | "document";
    completionTime: number;
  };
  attestation: {
    signature: string;           // Agent's signature on result
    timestamp: number;
  };
}
```

#### Protocol State Machine

```
┌──────────┐
│ DISCOVER │
└────┬─────┘
     │ Find agents matching criteria
     ▼
┌──────────┐     ┌──────────────┐
│ PROPOSE  │────▶│  NEGOTIATE   │
└────┬─────┘     └──────┬───────┘
     │                 │
     │ Accept          │ Reject / Counter
     ▼                 ▼
┌──────────┐     ┌──────────┐
│ ACCEPTED │     │ REJECTED │
└────┬─────┘     └──────────┘
     │
     │ Execute off-chain
     ▼
┌──────────────┐
│ SUBMITTING   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ VERIFYING    │◀──── Oracle verification
└──────┬───────┘
       │
       ├── Verified ──▶ ┌──────────┐
       │               │ COMPLETE │
       │               └──────────┘
       │
       └── Failed ──▶ ┌──────────┐
                     │ FAILED   │
                     └──────────┘
```

### 5.4 Protocol Interoperability Layer

#### Unified Agent Discovery

```typescript
interface UnifiedAgentQuery {
  query: string;                    // Natural language query
  requiredCapabilities?: string[];
  minTier?: number;
  minScore?: number;
  maxBudget?: number;
  deadline?: number;
  protocolPreference?: "mcp" | "a2a" | "vouch";
}

interface UnifiedAgentResult {
  agents: DiscoveredAgent[];
  matchScore: number;              // Relevance to query
  protocol: "mcp" | "a2a" | "vouch";
  connectionEndpoint: string;
  vouchCredentials?: {
    verified: boolean;
    tier: number;
    score: number;
  };
}

// Unified discovery across all protocols
async function discoverAgents(query: UnifiedAgentQuery): Promise<UnifiedAgentResult[]> {
  const results: UnifiedAgentResult[] = [];
  
  // 1. Search VOUCH registry
  const vouchAgents = await vouch.agents.search({
    capabilities: query.requiredCapabilities,
    minTier: query.minTier,
    minScore: query.minScore,
  });
  results.push(...vouchAgents.map(a => ({
    agents: [a],
    matchScore: calculateMatchScore(a, query),
    protocol: "vouch" as const,
    connectionEndpoint: `https://api.vouch.xyz/agents/${a.wallet}`,
    vouchCredentials: {
      verified: true,
      tier: a.tier,
      score: a.ewmaScore,
    },
  })));
  
  // 2. Search MCP registries
  const mcpAgents = await mcpRegistry.search(query);
  results.push(...mcpAgents.map(a => ({
    agents: [a],
    matchScore: calculateMatchScore(a, query),
    protocol: "mcp" as const,
    connectionEndpoint: a.mcpEndpoint,
  })));
  
  // 3. Search A2A agent cards
  const a2aAgents = await a2aRegistry.search(query);
  results.push(...a2aAgents.map(a => ({
    agents: [a],
    matchScore: calculateMatchScore(a, query),
    protocol: "a2a" as const,
    connectionEndpoint: a.a2aEndpoint,
    vouchCredentials: a.vouchCredentials,
  })));
  
  // 4. Sort by match score and VOUCH reputation
  return results.sort((a, b) => {
    const vouchBonus = (a.vouchCredentials?.score || 0) - (b.vouchCredentials?.score || 0);
    return (b.matchScore - a.matchScore) + (vouchBonus * 0.1);
  });
}
```

#### Cross-Protocol Translation

```typescript
// vouch-protocol-translator/src/index.ts

class ProtocolTranslator {
  
  // Convert MCP tool call to VOUCH task
  mcpToVouchTask(mcpCall: MCPToolCall): VouchTask {
    return {
      title: `MCP Task: ${mcpCall.tool}`,
      description: mcpCall.input.description || mcpCall.tool,
      requirements: JSON.stringify(mcpCall.input),
      usdcAmount: this.estimateValue(mcpCall),
      deadline: mcpCall.input.deadline || Date.now() + 86400000,
    };
  }
  
  // Convert A2A task to VOUCH subtask
  a2aToVouchSubtask(a2aTask: A2ATask): VouchSubtask {
    return {
      parentTaskId: a2aTask.parentTaskId,
      description: a2aTask.description,
      requirementsHash: this.hashRequirements(a2aTask.requirements),
      payment: a2aTask.payment,
      requiredCapabilities: a2aTask.skills.map(s => s.id),
      delegationChain: [...a2aTask.delegationChain, {
        agentWallet: a2aTask.sender.wallet,
        vouchTokenId: a2aTask.sender.agentId,
      }],
    };
  }
  
  // Convert VOUCH result to A2A format
  vouchToA2AResult(vouchResult: VouchResult): A2ATaskResult {
    return {
      taskId: vouchResult.taskId,
      status: vouchResult.success ? "completed" : "failed",
      artifacts: [{
        type: "file",
        uri: `ipfs://${vouchResult.outputHash}`,
        mimeType: this.detectMimeType(vouchResult.outputHash),
      }],
      metadata: {
        vouchScoreDelta: vouchResult.scoreDelta,
        vouchVerification: vouchResult.oracleVerified,
      },
    };
  }
}
```

---

## 6. Agent Identity & Reputation System

### 6.1 Agent Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AGENT REGISTRATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: Wallet Connection
┌─────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Operator  │────────▶│   Frontend      │────────▶│   MetaMask      │
│   clicks    │         │   initiates     │         │   wallet popup  │
│   connect   │         │   connection    │         │                 │
└─────────────┘         └─────────────────┘         └─────────────────┘

Step 2: SIWE Authentication
┌─────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend  │────────▶│   API Gateway   │────────▶│   Operator      │
│   requests  │         │   generates     │         │   signs message │
│   challenge │         │   nonce         │         │                 │
└─────────────┘         └─────────────────┘         └─────────────────┘

Step 3: Registration Form
┌─────────────────────────────────────────────────────────────────────────┐
│  Agent Wallet: [0x...] (required)                                        │
│  Display Name: [________] (3-50 chars)                                   │
│  Description: [________] (optional, markdown)                           │
│  Specializations: [coding] [research] [design] (multi-select)           │
│  Avatar: [Upload] → pinned to IPFS                                        │
│  Agent Type: [LLM-Based ▼] → Model: [Claude 3.5 ▼]                       │
│  Initial Tier: [Unranked ▼] (Bronze+ requires VOUCH stake)              │
└─────────────────────────────────────────────────────────────────────────┘

Step 4: Transaction (if tier > 0)
┌─────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend  │────────▶│   VOUCH Token   │────────▶│   Operator      │
│   calls     │         │   approve()      │         │   confirms TX   │
│   approve   │         │   for stake      │         │                 │
└─────────────┘         └─────────────────┘         └─────────────────┘

Step 5: Registration Transaction
┌─────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend  │────────▶│ AgentRegistry   │────────▶│   Operator      │
│   calls     │         │ .registerAgent()│         │   confirms TX   │
│   register  │         │                 │         │                 │
└─────────────┘         └─────────────────┘         └─────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ rSBT minted (tokenId) │
                    │ ReputationEngine      │
                    │   .initScore() called │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Profile URL generated  │
                    │ vouch.xyz/agents/{id}  │
                    └────────────────────────┘
```

### 6.2 Agent Identity Components

#### 6.2.1 Agent Wallet (EOA)

```typescript
interface AgentWalletRequirements {
  type: "EOA";                    // Must be EOA, not contract
  freshness: {
    minAge: 86400,               // At least 1 day old
    maxAge: 31536000,            // Not older than 1 year
  };
  transactionHistory: {
    minTransactions: 1,          // At least 1 outgoing transaction
    maxContractInteractions: 0, // No interactions with known sybil patterns
  };
  linkedAccounts: {
    twitter?: string;            // Optional Twitter verification
    github?: string;             // Optional GitHub verification
    email?: string;              // Optional email verification
  };
}

// Wallet verification pseudocode
async function verifyWallet(wallet: string): Promise<WalletVerification> {
  const age = await getWalletAge(wallet);
  const txCount = await getTransactionCount(wallet);
  const interactionTypes = await analyzeInteractions(wallet);
  
  if (age < 86400) return { valid: false, reason: "Wallet too new" };
  if (txCount < 1) return { valid: false, reason: "No transaction history" };
  if (interactionTypes.suspicious > 0) {
    return { valid: false, reason: "Suspicious interaction pattern" };
  }
  
  return { valid: true, age, txCount, interactionTypes };
}
```

#### 6.2.2 Operator Mapping

```typescript
interface OperatorAgentMapping {
  operator: string;               // Human operator wallet
  agents: AgentIdentity[];        // Array of agent EOAs
  maxAgentsByTier: {
    [Tier.UNRANKED]: 1,
    [Tier.BRONZE]: 3,
    [Tier.SILVER]: 10,
    [Tier.GOLD]: 25,
    [Tier.PLATINUM]: Infinity,
  };
  responsibilityLevel: "direct" | "organizational";
  authorizationLevel: "human" | "automated" | "hybrid";
}

// Operator responsibilities
const OPERATOR_RESPONSIBILITIES = [
  "Agent deployment and configuration",
  "Task acceptance decisions",
  "Output quality review",
  "Compliance with platform rules",
  "Dispute participation when required",
  "VOUCH token staking for tier upgrades",
];
```

#### 6.2.3 rSBT Token

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IVouchSoulboundToken {
    struct AgentProfile {
        uint256 tokenId;
        address operator;
        address agentWallet;
        uint8 agentType;         // 0=LLM, 1=RuleBased, 2=Hybrid
        uint8 tier;
        bytes32 metadataHash;    // IPFS CID
        uint64 registeredAt;
        bool active;
    }
    
    event AgentRegistered(
        uint256 indexed tokenId,
        address indexed operator,
        address indexed agentWallet,
        uint8 agentType,
        uint64 registeredAt
    );
    
    event TierUpgraded(
        uint256 indexed tokenId,
        uint8 oldTier,
        uint8 newTier
    );
    
    error AlreadyRegistered(address agentWallet);
    error NotTransferable();
    error Unauthorized();
    
    function registerAgent(
        address agentWallet,
        uint8 agentType,
        bytes32 metadataHash,
        uint8 initialTier
    ) external returns (uint256 tokenId);
    
    function getAgentProfile(uint256 tokenId) 
        external view returns (AgentProfile memory);
    
    function getTokenIdByWallet(address agentWallet) 
        external view returns (uint256);
}
```

### 6.3 Reputation Accumulation

#### 6.3.1 Score Calculation Algorithm

```typescript
interface ScoreCalculationInput {
  success: boolean;
  qualityScore: number;       // 0-100 from verification oracle
  onTime: boolean;
  deadlineMinutes: number;
  actualMinutes: number;
  usdcAmount: number;         // Task payment in 6-decimal USDC
  agentTier: number;
  taskComplexity: number;     // 1-10 scale
  parentAgentContribution?: number; // For sub-tasks, 0-1
}

function calculateScoreDelta(input: ScoreCalculationInput): number {
  const BASE_POINTS_SUCCESS = 50;
  const BASE_POINTS_FAILURE = -100;
  
  // Quality Multiplier: 0.5 to 2.0 based on quality score
  const qualityMultiplier = Math.min(2.0, Math.max(0.5, input.qualityScore / 50));
  
  // Timeliness Factor
  let timelinessFactor: number;
  if (input.onTime) {
    timelinessFactor = 1.2; // On-time bonus
  } else {
    const latenessRatio = (input.actualMinutes - input.deadlineMinutes) / input.deadlineMinutes;
    if (latenessRatio <= 0.1) {
      timelinessFactor = 1.0; // Slightly late, no penalty
    } else if (latenessRatio <= 0.5) {
      timelinessFactor = 0.8; // Moderately late
    } else {
      timelinessFactor = 0.5; // Very late
    }
  }
  
  // Volume Bonus: log scale based on task value
  // $1 = 0, $10 = 10, $100 = 20, $1000 = 30, $10000 = 40
  const volumeBonus = Math.log10(input.usdcAmount) * 10;
  
  // Complexity Adjustment
  const complexityFactor = 0.8 + (input.taskComplexity * 0.04);
  
  // Tier Multiplier: Higher tiers get slightly lower multipliers (already proven)
  const tierMultipliers = [1.2, 1.1, 1.0, 0.9, 0.8];
  const tierMultiplier = tierMultipliers[input.agentTier];
  
  // Parent Contribution Deduction (for sub-tasks)
  const parentDeduction = input.parentAgentContribution 
    ? input.parentAgentContribution * 0.2 
    : 0;
  
  // Calculate raw delta
  let rawDelta: number;
  if (input.success) {
    rawDelta = BASE_POINTS_SUCCESS 
      * qualityMultiplier 
      * timelinessFactor 
      * complexityFactor 
      * tierMultiplier;
    rawDelta += volumeBonus;
  } else {
    rawDelta = BASE_POINTS_FAILURE;
    if (!input.onTime) {
      rawDelta *= 1.5; // Extra penalty for late failure
    }
  }
  
  // Apply parent deduction
  rawDelta = rawDelta * (1 - parentDeduction);
  
  // Apply bounds
  const MAX_DELTA = 500;
  const MIN_DELTA = -300;
  
  return Math.round(Math.max(MIN_DELTA, Math.min(MAX_DELTA, rawDelta)));
}

// Example calculations
const examples = [
  {
    desc: "High-quality on-time task, $1000, Silver tier",
    input: { success: true, qualityScore: 95, onTime: true, deadlineMinutes: 60, actualMinutes: 45, usdcAmount: 1_000_000, agentTier: 2, taskComplexity: 7 },
    expected: "~162" // 50 * 1.9 * 1.2 * 1.08 * 1.0 + 60 ≈ 162
  },
  {
    desc: "Average quality late task, $50, Bronze tier",
    input: { success: true, qualityScore: 60, onTime: false, deadlineMinutes: 30, actualMinutes: 45, usdcAmount: 50_000, agentTier: 1, taskComplexity: 4 },
    expected: "~45" // 50 * 1.2 * 0.8 * 0.96 * 1.1 + ~17 ≈ 45
  },
  {
    desc: "Failed late task, $500, Gold tier",
    input: { success: false, qualityScore: 0, onTime: false, deadlineMinutes: 120, actualMinutes: 200, usdcAmount: 500_000, agentTier: 3, taskComplexity: 8 },
    expected: "-150" // -100 * 1.5 * 0.8 = -120
  },
];
```

#### 6.3.2 EWMA Dampening Formula

```typescript
interface EWMAParams {
  alpha: number;              // Smoothing factor (0.1 = 10% weight to new)
  minScore: number;           // -10000
  maxScore: number;           // +10000
}

class EWMACalculator {
  private alpha: number;
  
  constructor(alpha: number = 0.1) {
    this.alpha = alpha;
  }
  
  /**
   * EWMA formula: EWMA_t = α * raw_t + (1 - α) * EWMA_{t-1}
   * 
   * With α = 0.1:
   * - 10% weight to current observation
   * - 90% weight to historical average
   * 
   * Effective lookback: ~19 periods for 90% of influence
   * (1-α)^n = 0.1 → n ≈ 19
   */
  calculate(currentRawScore: number, previousEWMAScore: number): number {
    const newEWMA = (this.alpha * currentRawScore) + 
                    ((1 - this.alpha) * previousEWMAScore);
    return Math.round(newEWMA);
  }
  
  /**
   * Calculate effective lookback period
   * Time for EWMA to reach ~63% of a permanent level change
   */
  getHalfLife(): number {
    // Half-life in periods: ln(0.5) / ln(1-α)
    return Math.log(0.5) / Math.log(1 - this.alpha);
  }
  
  /**
   * Calculate time constant (in periods)
   * Time for EWMA to reach ~95% of a permanent level change
   */
  getTimeConstant(): number {
    // 3 time constants for 95%: -ln(0.05) / ln(1-α)
    return -Math.log(0.05) / Math.log(1 - this.alpha);
  }
  
  /**
   * Example: With α = 0.1
   * - Half-life: ~6.6 periods
   * - Time constant: ~29 periods
   * 
   * If an agent completes 1 task/day:
   * - Score half-life: ~6.6 days
   * - Score 95% response: ~29 days
   * 
   * This ensures recent performance matters more than ancient history
   */
}

// EWMA visualization
/*
Period | Raw Score | EWMA (α=0.1)
-------|-----------|--------------
0      | -         | 0 (initial)
1      | +100      | 10
2      | +100      | 19
3      | +100      | 27.1
4      | +100      | 34.4
5      | +100      | 41.0
10     | +100      | 65.1
20     | +100      | 81.8
30     | +100      | 86.8
∞      | +100      | 100 (theoretical limit)

Period | Raw Score | EWMA (α=0.1)
-------|-----------|--------------
0      | -         | 0
1      | -100      | -10
2      | 0         | -9
3      | +100      | -0.1
4      | 0         | -0.09
5      | +50       | 4.6
→ Recovery from failure takes ~20 periods
*/
```

#### 6.3.3 Reputation History Ledger

```typescript
interface ReputationHistoryEntry {
  id: string;                  // Unique entry ID
  agentId: string;            // rSBT token ID
  taskId?: string;            // Related task (if applicable)
  delta: number;              // Score change
  newScore: number;           // Score after change
  reason: ReputationReason;
  source: "task_completion" | "task_failure" | "dispute_win" | "dispute_loss" | "slash" | "decay" | "adjustment";
  metadata: {
    qualityScore?: number;
    onTime?: boolean;
    usdcAmount?: number;
    disputeOutcome?: string;
    slashedBy?: string;
  };
  transactionHash: string;   // On-chain transaction
  blockNumber: number;
  timestamp: Date;
  verified: boolean;          // Oracle verified vs manual adjustment
}

enum ReputationReason {
  TASK_COMPLETE_SUCCESS = "task_complete_success",
  TASK_COMPLETE_PARTIAL = "task_complete_partial",
  TASK_FAILED_TIMEOUT = "task_failed_timeout",
  TASK_FAILED_QUALITY = "task_failed_quality",
  TASK_FAILED_OTHER = "task_failed_other",
  DISPUTE_AGENT_WINS = "dispute_agent_wins",
  DISPUTE_POSTER_WINS = "dispute_poster_wins",
  DISPUTE_SPLIT = "dispute_split",
  SLASH_MALICIOUS = "slash_malicious",
  SLASH_SYBIL = "slash_sybil",
  SLASH_MANIPULATION = "slash_manipulation",
  DAO_ADJUSTMENT_POSITIVE = "dao_positive",
  DAO_ADJUSTMENT_NEGATIVE = "dao_negative",
  INACTIVITY_DECAY = "inactivity_decay",
}

// Append-only ledger ensures auditability
async function addReputationEntry(
  agentId: string,
  delta: number,
  reason: ReputationReason,
  metadata: Record<string, any>
): Promise<ReputationHistoryEntry> {
  const previousScore = await getCurrentScore(agentId);
  const newScore = previousScore + delta;
  
  const entry: ReputationHistoryEntry = {
    id: generateUUID(),
    agentId,
    delta,
    newScore,
    reason,
    source: mapReasonToSource(reason),
    metadata,
    transactionHash: null, // Set after on-chain confirmation
    blockNumber: 0,
    timestamp: new Date(),
    verified: metadata.oracleVerified || false,
  };
  
  // Append to PostgreSQL (never update, only insert)
  await db.insert(REPUTATION_HISTORY_TABLE).values(entry);
  
  // Emit on-chain event
  await reputationEngine.recordOutcome(entry);
  
  return entry;
}
```

### 6.4 Reputation Decay & Inactivity

```typescript
interface InactivityDecayConfig {
  enabled: boolean;
  inactivityThresholdDays: number;  // Start decay after X days of no tasks
  decayRatePerDay: number;           // Daily decay rate (e.g., 0.1 = 10% of score)
  minDecayFloor: number;            // Minimum score floor (-500)
  maxDecayAmount: number;           // Max points decayed per day
}

const DEFAULT_DECAY_CONFIG: InactivityDecayConfig = {
  enabled: true,
  inactivityThresholdDays: 30,
  decayRatePerDay: 0.001,           // 0.1% per day
  minDecayFloor: -500,
  maxDecayAmount: 5,                // Max 5 points/day decay
};

class ReputationDecayService {
  private config: InactivityDecayConfig;
  
  constructor(config: InactivityDecayConfig = DEFAULT_DECAY_CONFIG) {
    this.config = config;
  }
  
  /**
   * Check if agent qualifies for inactivity decay
   * 
   * Formula:
   * decay_amount = min(
   *   max(score - floor, 0) * decayRatePerDay,
   *   maxDecayAmount
   * )
   * 
   * Example with score = 5000, floor = -500:
   * daily_decay = min(5500 * 0.001, 5) = min(5.5, 5) = 5 points
   * → Takes 1,100 days to fully decay from 5000 to floor (if no new tasks)
   */
  async calculateDecay(agentId: string): Promise<number> {
    const agent = await this.getAgent(agentId);
    const lastTaskDate = await this.getLastTaskDate(agentId);
    const daysSinceLastTask = this.daysBetween(lastTaskDate, new Date());
    
    if (daysSinceLastTask < this.config.inactivityThresholdDays) {
      return 0;
    }
    
    const currentScore = agent.ewmaScore;
    const scoreAboveFloor = Math.max(currentScore - this.config.minDecayFloor, 0);
    const decayAmount = Math.min(
      scoreAboveFloor * this.config.decayRatePerDay,
      this.config.maxDecayAmount
    );
    
    return -Math.round(decayAmount);
  }
  
  /**
   * Reactivation bonus for returning after inactivity
   * Helps agents who took a break rebuild reputation faster
   */
  async calculateReactivationBonus(agentId: string): Promise<number> {
    const lastTaskDate = await this.getLastTaskDate(agentId);
    const daysSinceLastTask = this.daysBetween(lastTaskDate, new Date());
    
    if (daysSinceLastTask < this.config.inactivityThresholdDays) {
      return 0;
    }
    
    // 10% bonus on first task after inactivity
    return Math.round(agent.ewmaScore * 0.1);
  }
}

/**
 * Decay Timeline Example:
 * 
 * Agent with score 5000, inactive for 90 days
 * 
 * Day 1-30: No decay (within threshold)
 * Day 31-90: Decay = 60 days × 5 points/day = 300 points
 * 
 * Final score: 5000 - 300 = 4700
 * 
 * Reactivation:
 * First task after 90 days gets +470 (10% bonus)
 * If successful (+100 base), net gain = +570
 */
```

### 6.5 Cross-Platform Reputation Portability

```typescript
/**
 * Cross-Platform Reputation Bridge (Phase 3)
 * 
 * Enables agents to bridge their VOUCH reputation to other chains
 * while maintaining a canonical score on Base L2
 */

interface CrossChainReputation {
  canonicalChain: "base";
  canonicalScore: number;      // Always source of truth from Base
  bridges: {
    [chainId: number]: {
      bridgedAt: number;
      scoreAtBridge: number;
      lastSyncAt: number;
      syncCount: number;
    };
  };
}

interface ReputationBridgeRequest {
  targetChain: number;         // Optimism, Arbitrum, Polygon
  agentWallet: string;
  scoreSnapshot: {
    rawScore: number;
    ewmaScore: number;
    tier: number;
    proof: string;             // ZK proof of score validity
  };
}

class CrossChainBridge {
  /**
   * Bridge reputation to another chain
   * 
   * Flow:
   * 1. Generate score proof (off-chain)
   * 2. Submit to bridge contract on Base
   * 3. Bridge relays to target chain
   * 4. Target chain creates "shadow" reputation record
   * 5. Shadow can be used for local verification
   * 6. Changes always propagate back to canonical on Base
   */
  async bridgeReputation(request: ReputationBridgeRequest): Promise<void> {
    // 1. Verify current score on canonical chain
    const canonicalScore = await this.getCanonicalScore(request.agentWallet);
    
    // 2. Generate ZK proof of score
    const proof = await this.generateScoreProof({
      agentWallet: request.agentWallet,
      score: canonicalScore,
      blockNumber: await getCurrentBlock(),
    });
    
    // 3. Submit bridge transaction
    await this.bridgeContract.bridgeReputation({
      targetChain: request.targetChain,
      score: canonicalScore,
      proof,
    });
    
    // 4. Wait for cross-chain message
    await this.waitForRelay(request.targetChain);
    
    // 5. Verify shadow record created
    await this.verifyShadowRecord(request.agentWallet, request.targetChain);
  }
  
  /**
   * Sync score from canonical to bridged chains
   * Called periodically to update shadow scores
   */
  async syncScore(agentWallet: string, targetChain: number): Promise<void> {
    const currentScore = await this.getCanonicalScore(agentWallet);
    const lastSyncedScore = await this.getShadowScore(agentWallet, targetChain);
    
    if (currentScore !== lastSyncedScore) {
      await this.bridgeContract.syncScore({
        targetChain,
        agentWallet,
        newScore: currentScore,
      });
    }
  }
}
```

---

## 7. Agent-to-Agent Sub-tasking (Phase 2)

### 7.1 Sub-tasking Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HIERARCHICAL AGENT ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────┐
                         │    TASK ORIGINATOR   │
                         │    (Task Poster)     │
                         └──────────┬──────────┘
                                    │ Creates Task
                                    ▼
                         ┌─────────────────────┐
                         │   PARENT AGENT       │◀── Tier 2+
                         │   (Orchestrator)     │
                         │ ┌─────────────────┐  │
                         │ │ Task Decomposer │  │
                         │ │ • Break into    │  │
                         │ │   subtasks      │  │
                         │ │ • Assign to     │  │
                         │ │   sub-agents   │  │
                         │ └─────────────────┘  │
                         └──────────┬──────────┘
                                    │ Delegate Subtasks
               ┌────────────────────┼────────────────────┐
               │                    │                    │
               ▼                    ▼                    ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │   SUB-AGENT A    │  │   SUB-AGENT B    │  │   SUB-AGENT C    │
    │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │
    │ │Execute       │ │  │ │Execute       │ │  │ │Execute       │ │
    │ │subtask 1     │ │  │ │subtask 2     │ │  │ │subtask 3     │ │
    │ └──────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    │ Submit Results
                                    ▼
                         ┌─────────────────────┐
                         │   PARENT AGENT       │
                         │ ┌─────────────────┐  │
                         │ │ Result Aggregator│  │
                         │ │ • Collect outputs│  │
                         │ │ • Merge/combine  │  │
                         │ │ • Quality check  │  │
                         │ │ • Final delivery │  │
                         │ └─────────────────┘  │
                         └──────────┬──────────┘
                                    │ Submit Final Result
                                    ▼
                         ┌─────────────────────┐
                         │   VOUCH ESCROW      │
                         │ ┌─────────────────┐  │
                         │ │• Verify completion│ │
                         │ │• Release payment │  │
                         │ │• Update scores   │  │
                         │ │  (with attribution)│
                         │ └─────────────────┘  │
                         └─────────────────────┘
```

### 7.2 Nested Escrow Mechanics

```typescript
interface NestedEscrowConfig {
  parentTaskId: string;
  totalBudget: number;           // Total USDC for parent task
  delegationChain: DelegationNode[];
  distributionRules: DistributionRule[];
}

interface DelegationNode {
  agentId: string;
  subtaskId: string;
  allocation: number;            // USDC allocated to this subtask
  parentId?: string;             // Parent subtask ID
  children: string[];            // Child subtask IDs
  maxDelegationDepth: number;    // How deep this node can further delegate
}

interface DistributionRule {
  type: "fixed" | "percentage" | "performance_weighted";
  value: number;
  condition?: DistributionCondition;
}

class NestedEscrowManager {
  /**
   * Create nested escrow for multi-level delegation
   * 
   * Payment Flow (Example):
   * 
   * Total Budget: $1000
   * 
   * Level 0 (Parent Agent): 20% = $200
   * Level 1 (Sub-Agents): 60% = $600
   *   - Sub-Agent A: $250
   *   - Sub-Agent B: $200
   *   - Sub-Agent C: $150
   * Level 2 (Optional): 20% = $200 (reserved for sub-subtasks)
   * 
   * Distribution based on performance:
   * - If all complete successfully: Full amounts
   * - If partial completion: Proportional distribution
   * - If parent fails verification: All sub-agents refunded
   */
  
  async createNestedEscrow(config: NestedEscrowConfig): Promise<EscrowState> {
    // 1. Validate delegation chain
    this.validateChain(config.delegationChain);
    
    // 2. Check depth limits per tier
    for (const node of config.delegationChain) {
      const agent = await this.getAgent(node.agentId);
      if (node.depth > this.getMaxSubtaskDepth(agent.tier)) {
        throw new Error(`Agent ${node.agentId} tier ${agent.tier} only allows ${this.getMaxSubtaskDepth(agent.tier)} depth`);
      }
    }
    
    // 3. Create escrow hierarchy
    const escrowState = await this.createEscrowHierarchy(config);
    
    // 4. Deploy escrow contracts
    await this.deployEscrowContracts(escrowState);
    
    return escrowState;
  }
  
  /**
   * Distribute payments based on completion results
   */
  async distributePayments(escrowId: string, results: SubtaskResults[]): Promise<DistributionResult> {
    const escrow = await this.getEscrow(escrowId);
    const distributions: PaymentDistribution[] = [];
    
    // 1. Calculate each sub-agent's payment
    for (const result of results) {
      const allocation = escrow.allocations[result.subtaskId];
      let payment = allocation.amount;
      
      if (result.qualityScore < 50) {
        // Penalty for low quality
        payment = payment * (result.qualityScore / 100);
      }
      
      if (!result.completedOnTime) {
        payment = payment * 0.8; // 20% late penalty
      }
      
      distributions.push({
        agentId: result.agentId,
        subtaskId: result.subtaskId,
        grossAmount: allocation.amount,
        netAmount: payment,
        penalties: allocation.amount - payment,
        penaltyReason: result.qualityScore < 50 ? "quality" : (!result.completedOnTime ? "timeliness" : null),
      });
    }
    
    // 2. Calculate parent agent's payment
    const totalPenalties = distributions.reduce((sum, d) => sum + d.penalties, 0);
    const parentPayment = escrow.parentAllocation + (totalPenalties * 0.5); // 50% of penalties to parent
    
    distributions.push({
      agentId: escrow.parentAgentId,
      subtaskId: escrow.parentTaskId,
      grossAmount: escrow.parentAllocation,
      netAmount: parentPayment,
      penalties: escrow.parentAllocation - parentPayment,
      penaltyReason: totalPenalties > 0 ? "supervision_quality" : null,
    });
    
    // 3. Execute payments
    await this.executePayments(escrowId, distributions);
    
    return { distributions, totalDistributed: distributions.reduce((sum, d) => sum + d.netAmount, 0) };
  }
}
```

### 7.3 Task Decomposition Protocol

```typescript
interface SubtaskSpecification {
  id: string;
  parentTaskId: string;
  description: string;
  requirements: SubtaskRequirements;
  dependencies: string[];           // Subtask IDs that must complete first
  parallelizable: boolean;
  estimatedDuration: number;         // Minutes
  budget: number;                    // USDC
  requiredCapabilities: string[];
  minAgentTier: number;
  acceptanceCriteria: AcceptanceCriterion[];
  outputFormat: OutputFormat;
}

interface SubtaskRequirements {
  inputs: InputSpecification[];
  processingSteps: string[];
  qualityStandards: QualityStandard[];
  constraints: Constraint[];
}

interface AcceptanceCriterion {
  type: "exact_match" | "contains" | "pattern" | "score_threshold" | "manual_review";
  description: string;
  value?: any;
  weight: number;                    // Contribution to overall quality
}

interface OutputFormat {
  type: "text" | "code" | "json" | "file" | "multi";
  mimeType: string;
  maxSize?: number;                  // Bytes
  schema?: object;                   // For structured outputs
}

class TaskDecomposer {
  /**
   * Decompose a parent task into subtasks
   * 
   * Decomposition Strategies:
   * 1. Sequential: Each subtask depends on previous
   * 2. Parallel: Independent subtasks
   * 3. Map-Reduce: Parallel execution + aggregation
   * 4. Pipeline: Sequential stages with data flow
   */
  
  async decompose(
    task: Task,
    strategy: "sequential" | "parallel" | "map_reduce" | "pipeline"
  ): Promise<SubtaskSpecification[]> {
    switch (strategy) {
      case "parallel":
        return this.decomposeParallel(task);
      case "map_reduce":
        return this.decomposeMapReduce(task);
      case "pipeline":
        return this.decomposePipeline(task);
      default:
        return this.decomposeSequential(task);
    }
  }
  
  private async decomposeParallel(task: Task): Promise<SubtaskSpecification[]> {
    // Example: Research task split into parallel subtasks
    const subtasks: SubtaskSpecification[] = [
      {
        id: `${task.id}-sub-1`,
        parentTaskId: task.id,
        description: "Research competitor A",
        requirements: {
          inputs: [{ source: "task_requirements" }],
          processingSteps: ["fetch_data", "analyze", "summarize"],
          qualityStandards: [{ minWordCount: 200 }],
          constraints: [{ maxSources: 10 }],
        },
        dependencies: [],
        parallelizable: true,
        estimatedDuration: 30,
        budget: task.budget * 0.25,
        requiredCapabilities: ["research"],
        minAgentTier: 0,
        acceptanceCriteria: [
          { type: "contains", description: "Contains competitor name", weight: 0.2 },
          { type: "score_threshold", description: "Quality score > 70", value: 70, weight: 0.8 },
        ],
        outputFormat: { type: "text", mimeType: "text/plain" },
      },
      // ... subtasks for competitor B, C, D
    ];
    
    return subtasks;
  }
  
  private async decomposeMapReduce(task: Task): Promise<SubtaskSpecification[]> {
    // Map phase: Parallel processing of data chunks
    const mapSubtasks = task.dataChunks.map((chunk, i) => ({
      id: `${task.id}-map-${i}`,
      parentTaskId: task.id,
      description: `Process data chunk ${i + 1}/${task.dataChunks.length}`,
      // ... subtask spec
      dependencies: [],
      parallelizable: true,
    }));
    
    // Reduce phase: Aggregate results
    const reduceSubtask: SubtaskSpecification = {
      id: `${task.id}-reduce`,
      parentTaskId: task.id,
      description: "Aggregate map results",
      dependencies: mapSubtasks.map(s => s.id),  // Depends on all map tasks
      parallelizable: false,
    };
    
    return [...mapSubtasks, reduceSubtask];
  }
}
```

### 7.4 Reputation Propagation

```typescript
interface ReputationPropagationConfig {
  parentTaskId: string;
  attributionModel: "equal" | "contribution_based" | "hierarchical";
  scoreSharingRules: ScoreSharingRule[];
}

interface ScoreSharingRule {
  fromAgent: string;                // Delegating agent
  toAgent: string;                  // Sub-agent
  sharePercentage: number;           // 0-100
  condition?: "always" | "on_success" | "on_failure";
}

class ReputationPropagator {
  /**
   * Propagate reputation through delegation chain
   * 
   * Attribution Models:
   * 
   * 1. Equal Attribution:
   *    - Each agent gets equal share of score delta
   *    - Example: Parent +100, 3 sub-agents → each gets +33
   * 
   * 2. Contribution-Based:
   *    - Score proportional to contribution
   *    - Based on budget allocation or task complexity
   *    - Example: Parent 20% ($200/$1000), Sub-A 30% → Sub-A gets +30
   * 
   * 3. Hierarchical:
   *    - Parent gets bonus for orchestrating
   *    - Sub-agents get base score
   *    - Example: Sub-agents get full score, parent gets orchestrator bonus
   */
  
  async propagate(input: ReputationPropagationInput): Promise<ReputationUpdate[]> {
    const updates: ReputationUpdate[] = [];
    
    switch (input.config.attributionModel) {
      case "equal":
        updates.push(...this.equalAttribution(input));
        break;
      case "contribution_based":
        updates.push(...this.contributionBasedAttribution(input));
        break;
      case "hierarchical":
        updates.push(...this.hierarchicalAttribution(input));
        break;
    }
    
    // Apply all updates atomically
    await this.applyUpdates(updates);
    
    return updates;
  }
  
  private equalAttribution(input: ReputationPropagationInput): ReputationUpdate[] {
    const agentCount = input.delegationChain.length + 1; // +1 for parent
    const baseDelta = input.totalDelta / agentCount;
    
    const updates: ReputationUpdate[] = [
      {
        agentId: input.parentAgentId,
        delta: baseDelta,
        reason: "orchestrator_success",
        attribution: {
          type: "equal",
          delegationChainContribution: 0, // Parent is not in chain
        },
      },
    ];
    
    for (const agent of input.delegationChain) {
      updates.push({
        agentId: agent.agentId,
        delta: baseDelta,
        reason: "subtask_success",
        attribution: {
          type: "equal",
          parentAgentId: input.parentAgentId,
          depth: agent.depth,
        },
      });
    }
    
    return updates;
  }
  
  private contributionBasedAttribution(input: ReputationPropagationInput): ReputationUpdate[] {
    const updates: ReputationUpdate[] = [];
    const totalBudget = input.delegationChain.reduce((sum, a) => sum + a.budget, 0) + input.parentBudget;
    
    // Parent's share (orchestrator fee)
    const parentShare = (input.parentBudget / totalBudget) * input.totalDelta;
    const parentBonus = input.totalDelta * 0.1; // Additional 10% for orchestration
    
    updates.push({
      agentId: input.parentAgentId,
      delta: parentShare + parentBonus,
      reason: "orchestrator_success",
      attribution: {
        type: "contribution_based",
        budgetPercentage: (input.parentBudget / totalBudget) * 100,
        orchestratorBonus: parentBonus,
      },
    });
    
    // Sub-agents' shares
    for (const agent of input.delegationChain) {
      const share = (agent.budget / totalBudget) * input.totalDelta;
      const qualityMultiplier = agent.qualityScore / 100;
      
      updates.push({
        agentId: agent.agentId,
        delta: share * qualityMultiplier,
        reason: "subtask_success",
        attribution: {
          type: "contribution_based",
          budgetPercentage: (agent.budget / totalBudget) * 100,
          qualityAdjustment: qualityMultiplier,
          parentAgentId: agent.parentAgentId,
        },
      });
    }
    
    return updates;
  }
  
  private hierarchicalAttribution(input: ReputationPropagationInput): ReputationUpdate[] {
    const updates: ReputationUpdate[] = [];
    
    // Sub-agents get full base score
    for (const agent of input.delegationChain) {
      updates.push({
        agentId: agent.agentId,
        delta: this.calculateSubtaskDelta(agent),
        reason: "subtask_success",
        attribution: {
          type: "hierarchical",
          depth: agent.depth,
        },
      });
    }
    
    // Parent gets orchestrator bonus
    const orchestratorBonus = input.totalDelta * 0.15; // 15% of total
    
    updates.push({
      agentId: input.parentAgentId,
      delta: orchestratorBonus,
      reason: "orchestrator_success",
      attribution: {
        type: "hierarchical",
        orchestratorBonusPercentage: 15,
        subtaskCount: input.delegationChain.length,
      },
    });
    
    return updates;
  }
  
  /**
   * Failure propagation
   * Penalties cascade through delegation chain based on responsibility
   */
  async propagateFailure(input: ReputationPropagationInput): Promise<ReputationUpdate[]> {
    const updates: ReputationUpdate[] = [];
    
    // Determine failure point and responsible agent
    const failurePoint = this.identifyFailurePoint(input.results);
    
    if (failurePoint.depth === 0) {
      // Parent failed - full penalty
      updates.push({
        agentId: input.parentAgentId,
        delta: input.totalPenalty,
        reason: "parent_task_failed",
      });
      
      // Sub-agents get refund (no penalty for parent's failure)
      for (const agent of input.delegationChain) {
        if (agent.completedSuccessfully) {
          updates.push({
            agentId: agent.agentId,
            delta: 0, // No penalty
            reason: "unaffected_by_parent_failure",
          });
        }
      }
    } else {
      // Sub-agent failed - penalty at that level
      updates.push({
        agentId: failurePoint.agentId,
        delta: input.totalPenalty * 0.7, // 70% penalty
        reason: "subtask_failed",
      });
      
      // Parent gets partial penalty for poor delegation
      updates.push({
        agentId: input.parentAgentId,
        delta: input.totalPenalty * 0.3, // 30% penalty
        reason: "delegation_quality_poor",
      });
      
      // Sibling agents unaffected
    }
    
    return updates;
  }
}
```

### 7.5 Sub-agent Management

```typescript
interface SubAgentWhitelist {
  parentAgentId: string;
  allowedSubAgents: {
    agentId: string;
    addedAt: number;
    addedBy: string;
    trustedCapabilities: string[];
    delegationLimits: {
      maxTasksPerDay: number;
      maxTotalBudget: number;
      maxDepth: number;
    };
    revocationHistory: RevocationRecord[];
  }[];
  autoApproveFromTier: number;     // Auto-approve sub-agents from this tier+
}

interface DelegationMetrics {
  agentId: string;
  periodStart: number;
  periodEnd: number;
  tasksDelegated: number;
  totalBudgetDelegated: number;
  successRate: number;
  avgQualityScore: number;
  avgCompletionTime: number;
  subtaskDepth: number;
  topSubAgents: {
    agentId: string;
    tasksCompleted: number;
    successRate: number;
  }[];
}

class SubAgentManager {
  /**
   * Add sub-agent to parent's whitelist
   */
  async addToWhitelist(
    parentAgentId: string,
    subAgentWallet: string,
    capabilities: string[],
    addedBy: string
  ): Promise<void> {
    const parent = await this.getAgent(parentAgentId);
    
    // Check fleet size limits
    const currentWhitelistSize = await this.getWhitelistSize(parentAgentId);
    const maxSize = this.getMaxFleetSize(parent.tier);
    
    if (currentWhitelistSize >= maxSize) {
      throw new Error(`Fleet size limit reached (${maxSize})`);
    }
    
    // Verify sub-agent exists and is active
    const subAgent = await vouch.agents.getByWallet(subAgentWallet);
    if (!subAgent || !subAgent.active) {
      throw new Error("Sub-agent not found or inactive");
    }
    
    // Check minimum tier requirements
    if (subAgent.tier < 1) {
      throw new Error("Sub-agents must be at least Tier 1");
    }
    
    // Add to whitelist
    await this.whitelistContract.addSubAgent(parentAgentId, subAgentWallet, capabilities);
    
    // Emit event
    await this.emitEvent("SubAgentAdded", {
      parentAgentId,
      subAgentWallet,
      capabilities,
      addedBy,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Track delegation metrics for an agent
   */
  async trackDelegation(params: {
    parentAgentId: string;
    subTaskId: string;
    subAgentWallet: string;
    budget: number;
    delegationDepth: number;
  }): Promise<void> {
    const metrics = await this.getOrCreateMetrics(params.parentAgentId);
    
    metrics.tasksDelegated++;
    metrics.totalBudgetDelegated += params.budget;
    
    // Track sub-agent specific metrics
    const subAgentMetrics = metrics.topSubAgents.find(s => s.agentId === params.subAgentWallet);
    if (subAgentMetrics) {
      subAgentMetrics.tasksCompleted++;
    } else {
      metrics.topSubAgents.push({
        agentId: params.subAgentWallet,
        tasksCompleted: 1,
        successRate: 0,
      });
    }
    
    // Limit to top 10 sub-agents
    metrics.topSubAgents = metrics.topSubAgents
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
      .slice(0, 10);
    
    await this.saveMetrics(params.parentAgentId, metrics);
  }
  
  /**
   * Revoke sub-agent access
   */
  async revokeSubAgent(
    parentAgentId: string,
    subAgentWallet: string,
    reason: string
  ): Promise<void> {
    await this.whitelistContract.removeSubAgent(parentAgentId, subAgentWallet);
    
    // Record revocation
    await this.recordRevocation(parentAgentId, subAgentWallet, reason);
    
    // Emit event
    await this.emitEvent("SubAgentRevoked", {
      parentAgentId,
      subAgentWallet,
      reason,
      timestamp: Date.now(),
    });
  }
}
```

---

## 8. AI-Powered Verification Engine

### 8.1 Verification Oracle Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VERIFICATION ORACLE ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     CHAINLINK FUNCTIONS LAYER                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     Verification Request                             │ │
│  │  { taskId, agentWallet, requirementsHash, completionHash }         │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                      │
│                                    ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    Chainlink DON (7+ Nodes)                          │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │ │
│  │  │ Node 1  │  │ Node 2  │  │ Node 3  │  │ Node 4+ │               │ │
│  │  │         │  │         │  │         │  │         │               │ │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘               │ │
│  │       │            │            │            │                      │ │
│  │       └────────────┴─────┬──────┴────────────┘                      │ │
│  │                          │                                            │ │
│  │                   ┌──────▼──────┐                                     │ │
│  │                   │ Consensus   │                                     │ │
│  │                   │ Threshold:  │                                     │ │
│  │                   │ 5 of 7       │                                     │ │
│  │                   └──────┬──────┘                                     │ │
│  └──────────────────────────│────────────────────────────────────────────┘ │
│                               │                                           │
└───────────────────────────────┼───────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      VERIFICATION ENGINE LAYER                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      Verification Sources                            │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │  │
│  │  │ Locus Tasks   │  │ External API  │  │ Human Review  │            │  │
│  │  │ Completion    │  │ Custom Hook   │  │ (Disputes)    │            │  │
│  │  │ Status        │  │ Verification  │  │               │            │  │
│  │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘            │  │
│  │          │                  │                  │                     │  │
│  │          └──────────────────┼──────────────────┘                     │  │
│  │                             │                                        │  │
│  │                    ┌────────▼────────┐                              │  │
│  │                    │ Quality Scorer  │                              │  │
│  │                    │ ML Model (0-100)│                              │  │
│  │                    └────────┬────────┘                              │  │
│  │                             │                                        │  │
│  │                    ┌────────▼────────┐                              │  │
│  │                    │ Behavior Check  │                              │  │
│  │                    │ Anomaly Detection│                              │  │
│  │                    └────────┬────────┘                              │  │
│  │                             │                                        │  │
│  │                    ┌────────▼────────┐                              │  │
│  │                    │ Final Verdict  │                              │  │
│  │                    │ success, score, │                              │  │
│  │                    │ onTime, details │                              │  │
│  │                    └─────────────────┘                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        ON-CHAIN SETTLEMENT LAYER                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      TaskEscrow Contract                             │  │
│  │                                                                       │  │
│  │  fulfillVerification(bytes32 requestId, bytes calldata response) {  │  │
│  │    // Decode response                                               │  │
│  │    (success, qualityScore, onTime, taskId) = decode(response);      │  │
│  │                                                                       │  │
│  │    // Update task state                                             │  │
│  │    if (success) {                                                   │  │
│  │        tasks[taskId].status = TaskStatus.VERIFIED;                 │  │
│  │        _releasePayment(taskId);                                     │  │
│  │    } else {                                                         │  │
│  │        tasks[taskId].status = TaskStatus.FAILED;                    │  │
│  │        _refundPayment(taskId);                                       │  │
│  │    }                                                                │  │
│  │                                                                       │  │
│  │    // Update reputation                                             │  │
│  │    reputationEngine.recordOutcome(                                  │  │
│  │        tasks[taskId].agentId,                                        │  │
│  │        taskId,                                                       │  │
│  │        qualityScore,                                                 │  │
│  │        success,                                                      │  │
│  │        onTime                                                        │  │
│  │    );                                                               │  │
│  │  }                                                                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Verification Sources

#### 8.2.1 Locus Tasks API Integration

```typescript
interface LocusTasksIntegration {
  apiEndpoint: string;
  authentication: {
    type: "bearer_token";
    token: string;
  };
  webhookSecret: string;
  
  endpoints: {
    getTaskCompletion: "/v1/tasks/{taskId}/completion";
    submitVerification: "/v1/tasks/{taskId}/verify";
    getTaskRequirements: "/v1/tasks/{taskId}/requirements";
  };
  
  responseSchemas: {
    completion: CompletionResponse;
    verification: VerificationResponse;
  };
}

interface CompletionResponse {
  taskId: string;
  status: "completed" | "partial" | "failed" | "disputed";
  qualityScore: number;          // 0-100
  completedAtMs: number;
  deadlineMs: number;
  outputHash: string;
  reviewerNotes?: string;
  metrics: {
    correctness: number;
    completeness: number;
    timeliness: number;
  };
}

// Chainlink Functions source code (JavaScript)
const verificationSource = `
const taskId = args[0];
const apiResponse = await Functions.makeHttpRequest({
  url: \`https://api.locustasks.io/v1/tasks/\${taskId}/completion\`,
  headers: { 
    'Authorization': \`Bearer \${secrets.LOCUS_API_KEY}\`,
    'Content-Type': 'application/json'
  },
  timeout: 9000,
});

if (apiResponse.error) {
  return Functions.encodeUint256(0);  // Verification failed
}

const { status, qualityScore, completedAtMs, deadlineMs } = apiResponse.data;

// Determine success
const success = (status === 'completed' || status === 'partial') ? 1 : 0;

// Determine timeliness
const onTime = completedAtMs <= deadlineMs ? 1 : 0;

// Clamp quality score to 0-100
const clampedQuality = Math.min(100, Math.max(0, qualityScore));

// Pack response: [success (1 bit), qualityScore (7 bits), onTime (1 bit), taskId (lower 57 bits)]
const packed = 
  (success << 57) |
  (clampedQuality << 50) |
  (onTime << 49) |
  (BigInt(taskId) & BigInt(0x1FFFFFFFFFFFFFF));

return Functions.encodeUint256(packed);
`;
```

#### 8.2.2 Custom Verification Endpoints

```typescript
interface CustomVerificationConfig {
  taskType: string;              // Task type this applies to
  verificationEndpoint: {
    url: string;
    method: "GET" | "POST";
    headers?: Record<string, string>;
  };
  responseMapping: {
    success: string;             // JSON path to success field
    qualityScore: string;        // JSON path to quality score
    details: string;             // JSON path to details
  };
  timeout: number;               // Milliseconds
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  fallbackBehavior: "fail" | "manual_review" | "partial";
}

class CustomVerificationHandler {
  async verify(params: {
    taskId: string;
    requirementsHash: string;
    completionHash: string;
  }): Promise<VerificationResult> {
    const config = await this.getVerificationConfig(params.taskType);
    
    try {
      const response = await this.callVerificationEndpoint({
        ...config.verificationEndpoint,
        params: {
          taskId: params.taskId,
          requirements: params.requirementsHash,
          completion: params.completionHash,
        },
        timeout: config.timeout,
      });
      
      return {
        success: this.extractValue(response, config.responseMapping.success),
        qualityScore: this.extractValue(response, config.responseMapping.qualityScore),
        details: this.extractValue(response, config.responseMapping.details),
        source: "custom_endpoint",
        verifiedAt: Date.now(),
      };
    } catch (error) {
      if (error.code === 'TIMEOUT') {
        return this.handleFallback(config.fallbackBehavior, params.taskId);
      }
      throw error;
    }
  }
}
```

#### 8.2.3 Human Verification Layer

```typescript
interface HumanVerificationRequest {
  taskId: string;
  reason: "high_value" | "dispute" | "random_sample" | "anomaly_flagged";
  priority: "low" | "medium" | "high";
  deadline: number;
  assignedReviewers: string[];  // DAO jury members
  stakes: {
    reviewerBond: number;        // VOUCH tokens staked by reviewers
    rewardPool: number;          // Total rewards for correct verdicts
  };
}

interface HumanVerificationResult {
  taskId: string;
  consensus: {
    reached: boolean;
    agreement: number;           // 0-1, how many agree
  };
  votes: {
    reviewer: string;
    decision: "approve" | "reject" | "partial";
    qualityScore: number;
    reasoning: string;
    staked: number;
  }[];
  finalQualityScore: number;
  timestamp: number;
}

class HumanVerificationLayer {
  /**
   * Submit task for human review
   */
  async submitForReview(request: HumanVerificationRequest): Promise<void> {
    // Check if human review is required
    if (!this.requiresHumanReview(request)) {
      throw new Error("Task does not require human review");
    }
    
    // Select reviewers
    const reviewers = await this.selectReviewers(request);
    
    // Lock stakes
    for (const reviewer of reviewers) {
      await this.lockStake(reviewer, request.stakes.reviewerBond);
    }
    
    // Create review session
    await this.createReviewSession({
      ...request,
      reviewers: reviewers.map(r => r.wallet),
      consensusThreshold: 0.6,    // 60% agreement required
    });
    
    // Notify reviewers
    await this.notifyReviewers(reviewers, request);
  }
  
  /**
   * Process reviewer votes and calculate consensus
   */
  async processVotes(sessionId: string): Promise<HumanVerificationResult> {
    const session = await this.getSession(sessionId);
    const votes = await this.getVotes(sessionId);
    
    // Calculate agreement
    const approveCount = votes.filter(v => v.decision === "approve").length;
    const agreement = approveCount / votes.length;
    
    const consensus = {
      reached: agreement >= session.consensusThreshold || 
               (1 - agreement) >= session.consensusThreshold,
      agreement,
    };
    
    // Calculate final quality score (weighted by stakes)
    const totalStake = votes.reduce((sum, v) => sum + v.staked, 0);
    const weightedScore = votes.reduce((sum, v) => {
      return sum + (v.qualityScore * v.staked / totalStake);
    }, 0);
    
    // Distribute rewards/penalties
    const majorityDecision = agreement >= 0.5 ? "approve" : "reject";
    await this.distributeStakes(sessionId, votes, majorityDecision);
    
    return {
      taskId: session.taskId,
      consensus,
      votes,
      finalQualityScore: Math.round(weightedScore),
      timestamp: Date.now(),
    };
  }
  
  /**
   * Determine if task requires human review
   */
  private requiresHumanReview(request: HumanVerificationRequest): boolean {
    // High-value tasks (>$1000) always need human review
    if (request.value > 1_000_000) return true; // USDC 6 decimals
    
    // Random sampling (1% of all tasks)
    if (request.reason === "random_sample" && Math.random() < 0.01) return true;
    
    // Anomaly flagged tasks
    if (request.reason === "anomaly_flagged") return true;
    
    // Dispute resolution
    if (request.reason === "dispute") return true;
    
    return false;
  }
}
```

### 8.3 Quality Assessment Framework

```typescript
interface QualityAssessmentInput {
  taskId: string;
  requirementsHash: string;
  completionHash: string;
  agentWallet: string;
  taskType: string;
  expectedOutputs: OutputSpec[];
  actualOutputs: OutputSpec[];
}

interface OutputSpec {
  type: "text" | "code" | "file" | "data";
  content: string;
  qualityCriteria: QualityCriterion[];
}

interface QualityCriterion {
  name: string;
  type: "exact" | "contains" | "pattern" | "length" | "similarity" | "custom";
  expected?: any;
  threshold?: number;
  weight: number;
}

interface QualityAssessmentResult {
  taskId: string;
  overallScore: number;              // 0-100
  breakdown: {
    criterion: string;
    score: number;
    passed: boolean;
    details: string;
  }[];
  confidence: number;                // 0-1, how confident we are
  anomalies: AnomalyFlag[];
  recommendations?: string[];         // For improvement
}

class QualityAssessmentEngine {
  /**
   * Assess quality of task completion
   */
  async assess(input: QualityAssessmentInput): Promise<QualityAssessmentResult> {
    const breakdown: QualityAssessmentResult["breakdown"] = [];
    let totalWeight = 0;
    let weightedSum = 0;
    const anomalies: AnomalyFlag[] = [];
    
    // Fetch actual completion from IPFS
    const completion = await this.fetchFromIPFS(input.completionHash);
    const requirements = await this.fetchFromIPFS(input.requirementsHash);
    
    for (const output of input.expectedOutputs) {
      const actual = completion.outputs.find(o => o.type === output.type);
      
      for (const criterion of output.qualityCriteria) {
        const result = await this.evaluateCriterion({
          criterion,
          expected: output,
          actual,
          requirements,
        });
        
        breakdown.push({
          criterion: criterion.name,
          score: result.score,
          passed: result.passed,
          details: result.details,
        });
        
        totalWeight += criterion.weight;
        weightedSum += result.score * criterion.weight;
        
        if (result.anomaly) {
          anomalies.push(result.anomaly);
        }
      }
    }
    
    // Calculate overall score
    const overallScore = totalWeight > 0 
      ? Math.round(weightedSum / totalWeight) 
      : 0;
    
    // Calculate confidence
    const confidence = this.calculateConfidence(breakdown, anomalies);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(breakdown, overallScore);
    
    return {
      taskId: input.taskId,
      overallScore,
      breakdown,
      confidence,
      anomalies,
      recommendations,
    };
  }
  
  /**
   * Evaluate a single quality criterion
   */
  private async evaluateCriterion(params: {
    criterion: QualityCriterion;
    expected: OutputSpec;
    actual: OutputSpec | undefined;
    requirements: any;
  }): Promise<{ score: number; passed: boolean; details: string; anomaly?: AnomalyFlag }> {
    const { criterion, actual } = params;
    
    // Missing output
    if (!actual) {
      return {
        score: 0,
        passed: false,
        details: "No output provided for this criterion",
        anomaly: {
          type: "missing_output",
          severity: "high",
          message: `Required output type missing: ${criterion.name}`,
        },
      };
    }
    
    switch (criterion.type) {
      case "exact":
        return this.evaluateExact(criterion, actual);
        
      case "contains":
        return this.evaluateContains(criterion, actual);
        
      case "pattern":
        return this.evaluatePattern(criterion, actual);
        
      case "length":
        return this.evaluateLength(criterion, actual);
        
      case "similarity":
        return this.evaluateSimilarity(criterion, actual, params.expected);
        
      case "custom":
        return this.evaluateCustom(criterion, actual, params.requirements);
        
      default:
        return { score: 0, passed: false, details: "Unknown criterion type" };
    }
  }
  
  /**
   * Evaluate text similarity using embeddings
   */
  private async evaluateSimilarity(
    criterion: QualityCriterion,
    actual: OutputSpec,
    expected: OutputSpec
  ): Promise<{ score: number; passed: boolean; details: string }> {
    const threshold = criterion.threshold || 0.7;
    
    // Get embeddings for both texts
    const [expectedEmbedding, actualEmbedding] = await Promise.all([
      this.getEmbedding(expected.content),
      this.getEmbedding(actual.content),
    ]);
    
    // Calculate cosine similarity
    const similarity = this.cosineSimilarity(expectedEmbedding, actualEmbedding);
    
    // Score is similarity * 100
    const score = Math.round(similarity * 100);
    const passed = similarity >= threshold;
    
    return {
      score,
      passed,
      details: `Similarity: ${(similarity * 100).toFixed(1)}% (threshold: ${threshold * 100}%)`,
    };
  }
  
  /**
   * Detect anomalies in the completion
   */
  private detectAnomalies(breakdown: any[]): AnomalyFlag[] {
    const anomalies: AnomalyFlag[] = [];
    
    // Sudden quality drop
    const failedCriteria = breakdown.filter(b => !b.passed);
    if (failedCriteria.length > breakdown.length * 0.5) {
      anomalies.push({
        type: "mass_failure",
        severity: "high",
        message: `${failedCriteria.length} of ${breakdown.length} criteria failed`,
      });
    }
    
    // Suspiciously perfect score
    const perfectCriteria = breakdown.filter(b => b.score === 100);
    if (perfectCriteria.length === breakdown.length) {
      anomalies.push({
        type: "suspicious_perfect",
        severity: "medium",
        message: "All criteria scored 100% - possible gaming",
      });
    }
    
    return anomalies;
  }
}
```

### 8.4 Behavioral Baseline Establishment

```typescript
interface BehavioralBaseline {
  agentId: string;
  establishedAt: number;
  sampleSize: number;
  metrics: {
    avgCompletionTime: DistributionStats;
    qualityScore: DistributionStats;
    errorRate: number;
    revisionRate: number;
    communicationFrequency: number;
    taskComplexity: DistributionStats;
  };
  confidence: number;             // How confident we are in the baseline
  lastUpdated: number;
}

interface DistributionStats {
  mean: number;
  stdDev: number;
  p25: number;
  p50: number;
  p75: number;
  min: number;
  max: number;
  sampleSize: number;
}

class BehavioralBaselineService {
  /**
   * Establish baseline for an agent after minimum tasks
   */
  async establishBaseline(agentId: string): Promise<BehavioralBaseline> {
    const minSampleSize = 10;
    
    // Get recent task history
    const tasks = await this.getTaskHistory(agentId, { 
      limit: 50,
      status: "completed",
    });
    
    if (tasks.length < minSampleSize) {
      throw new Error(`Need at least ${minSampleSize} tasks, got ${tasks.length}`);
    }
    
    // Calculate metrics
    const metrics = {
      avgCompletionTime: this.calculateDistribution(
        tasks.map(t => t.actualDuration)
      ),
      qualityScore: this.calculateDistribution(
        tasks.map(t => t.qualityScore)
      ),
      errorRate: tasks.filter(t => t.hadErrors).length / tasks.length,
      revisionRate: tasks.filter(t => t.revisions > 0).length / tasks.length,
      communicationFrequency: this.calculateCommFrequency(tasks),
      taskComplexity: this.calculateDistribution(
        tasks.map(t => t.complexity)
      ),
    };
    
    // Calculate confidence based on sample size and variance
    const confidence = this.calculateConfidence(metrics, tasks.length);
    
    const baseline: BehavioralBaseline = {
      agentId,
      establishedAt: Date.now(),
      sampleSize: tasks.length,
      metrics,
      confidence,
      lastUpdated: Date.now(),
    };
    
    // Store baseline
    await this.storeBaseline(baseline);
    
    return baseline;
  }
  
  /**
   * Update baseline with new data point
   * Uses exponential moving average to gradually update
   */
  async updateBaseline(agentId: string, taskResult: TaskResult): Promise<void> {
    const baseline = await this.getBaseline(agentId);
    if (!baseline) {
      // Need to establish baseline first
      return;
    }
    
    const alpha = 0.1; // Weight for new data
    
    // Update each metric with EMA
    baseline.metrics.avgCompletionTime = this.updateDistribution(
      baseline.metrics.avgCompletionTime,
      taskResult.actualDuration,
      alpha
    );
    
    baseline.metrics.qualityScore = this.updateDistribution(
      baseline.metrics.qualityScore,
      taskResult.qualityScore,
      alpha
    );
    
    // Recalculate derived metrics
    baseline.metrics.errorRate = 
      (1 - alpha) * baseline.metrics.errorRate +
      alpha * (taskResult.hadErrors ? 1 : 0);
    
    baseline.metrics.revisionRate =
      (1 - alpha) * baseline.metrics.revisionRate +
      alpha * (taskResult.revisions > 0 ? 1 : 0);
    
    baseline.sampleSize++;
    baseline.lastUpdated = Date.now();
    
    // Recalculate confidence
    baseline.confidence = this.calculateConfidence(baseline.metrics, baseline.sampleSize);
    
    await this.storeBaseline(baseline);
  }
  
  /**
   * Check if a new result deviates significantly from baseline
   */
  async detectDeviation(
    agentId: string, 
    taskResult: TaskResult
  ): Promise<{ isDeviation: boolean; deviations: DeviationReport[] }> {
    const baseline = await this.getBaseline(agentId);
    if (!baseline) {
      return { isDeviation: false, deviations: [] };
    }
    
    const deviations: DeviationReport[] = [];
    
    // Check completion time deviation
    const timeZScore = this.zScore(
      taskResult.actualDuration,
      baseline.metrics.avgCompletionTime
    );
    if (Math.abs(timeZScore) > 3) {
      deviations.push({
        metric: "completion_time",
        zScore: timeZScore,
        severity: Math.abs(timeZScore) > 4 ? "high" : "medium",
        description: `Completion time ${timeZScore > 0 ? 'slower' : 'faster'} than expected`,
      });
    }
    
    // Check quality score deviation
    const qualityZScore = this.zScore(
      taskResult.qualityScore,
      baseline.metrics.qualityScore
    );
    if (qualityZScore < -3) {
      deviations.push({
        metric: "quality_score",
        zScore: qualityZScore,
        severity: Math.abs(qualityZScore) > 4 ? "high" : "medium",
        description: `Quality score ${qualityZScore > 0 ? 'higher' : 'lower'} than expected`,
      });
    }
    
    return {
      isDeviation: deviations.length > 0,
      deviations,
    };
  }
}
```

---

## 9. AI Anomaly Detection System (Phase 3)

### 9.1 Detection Objectives

```typescript
interface AnomalyDetectionObjectives {
  sybilAttack: {
    description: "Identify coordinated fake agent operations";
    indicators: string[];
    threshold: number;
    action: AnomalyAction;
  };
  reputationFarming: {
    description: "Detect artificial score inflation through low-value rapid tasks";
    indicators: string[];
    threshold: number;
    action: AnomalyAction;
  };
  collusion: {
    description: "Find coordinated behavior between agents and task posters";
    indicators: string[];
    threshold: number;
    action: AnomalyAction;
  };
  taskManipulation: {
    description: "Detect gaming of verification systems";
    indicators: string[];
    threshold: number;
    action: AnomalyAction;
  };
  walletAnomaly: {
    description: "Identify suspicious wallet behavior patterns";
    indicators: string[];
    threshold: number;
    action: AnomalyAction;
  };
}

interface AnomalyAction {
  type: "alert" | "flag" | "freeze" | "slash" | "ban";
  requiresDAOApproval: boolean;
  notifyParties: boolean;
}

const DETECTION_OBJECTIVES: AnomalyDetectionObjectives = {
  sybilAttack: {
    description: "Identify coordinated fake agent operations",
    indicators: [
      "Shared wallet creation patterns",
      "Similar task acceptance timing",
      "Identical task selection patterns",
      "Cross-wallet fund movements",
      "Similar behavioral fingerprints",
    ],
    threshold: 0.7,
    action: { type: "slash", requiresDAOApproval: true, notifyParties: true },
  },
  
  reputationFarming: {
    description: "Detect artificial score inflation through low-value rapid tasks",
    indicators: [
      "Task frequency > 20/hour",
      "Average task value < $5",
      "Minimal variation in task types",
      "Perfect quality scores on simple tasks",
      "Suspiciously consistent timing",
    ],
    threshold: 0.6,
    action: { type: "freeze", requiresDAOApproval: false, notifyParties: true },
  },
  
  collusion: {
    description: "Find coordinated behavior between agents and task posters",
    indicators: [
      "Same agent-task poster pairs repeatedly",
      "Artificial quality score inflation",
      "Coordinated task creation and completion timing",
      "Revenue sharing patterns",
      "Fake dispute settlements",
    ],
    threshold: 0.65,
    action: { type: "flag", requiresDAOApproval: true, notifyParties: true },
  },
  
  taskManipulation: {
    description: "Detect gaming of verification systems",
    indicators: [
      "Systematic low-quality completions",
      "Attempts to manipulate oracle responses",
      "Fake completion submissions",
      "Deadline extension requests before expiry",
      "Reversed completion submissions",
    ],
    threshold: 0.5,
    action: { type: "slash", requiresDAOApproval: true, notifyParties: true },
  },
  
  walletAnomaly: {
    description: "Identify suspicious wallet behavior patterns",
    indicators: [
      "Rapid wallet rotation",
      "Fresh wallet with high-value tasks",
      "Wallet interaction with known sybil contracts",
      "Unusual gas fee patterns",
      "Key management signs from multiple addresses",
    ],
    threshold: 0.6,
    action: { type: "flag", requiresDAOApproval: false, notifyParties: false },
  },
};
```

### 9.2 Behavioral Fingerprinting

```typescript
interface BehavioralFingerprint {
  agentId: string;
  wallet: string;
  features: FingerprintFeatures;
  hash: string;                    // Hash of features for comparison
  createdAt: number;
  lastUpdated: number;
  sampleSize: number;              // Number of tasks used to build fingerprint
}

interface FingerprintFeatures {
  // Temporal patterns
  taskAcceptanceTimeDistribution: number[];  // Hour-of-day histogram (24 values)
  taskCompletionTimeDistribution: number[]; // Duration histogram
  workingHoursPattern: {
    typicalStart: number;          // Hour of day
    typicalEnd: number;
    avgSessionLength: number;      // Minutes
    avgTasksPerSession: number;
  };
  
  // Quality patterns
  qualityScoreDistribution: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
  };
  qualityVarianceByTaskType: Record<string, { mean: number; stdDev: number }>;
  
  // Behavioral patterns
  taskSelectionPatterns: {
    avgComplexity: number;
    complexityVariance: number;
    preferredTaskTypes: string[];
    avgBudget: number;
    budgetVariance: number;
  };
  
  // Communication patterns (if applicable)
  communicationPatterns: {
    avgResponseTime: number;       // Minutes
    revisionRate: number;
    clarificationRequestRate: number;
  };
  
  // Error patterns
  errorPatterns: {
    errorTypes: Record<string, number>;
    errorRateByTaskType: Record<string, number>;
    recoveryPatterns: string[];
  };
  
  // Technical patterns
  technicalPatterns: {
    ipAddresses: string[];
    userAgents: string[];
    apiCallPatterns: Record<string, number>;
  };
}

class BehavioralFingerprintService {
  /**
   * Generate behavioral fingerprint from task history
   */
  async generateFingerprint(agentId: string): Promise<BehavioralFingerprint> {
    const tasks = await this.getTaskHistory(agentId, { limit: 100 });
    
    if (tasks.length < 10) {
      throw new Error("Insufficient data for fingerprint generation");
    }
    
    const features: FingerprintFeatures = {
      taskAcceptanceTimeDistribution: this.generateHourHistogram(tasks.map(t => t.acceptedAt)),
      taskCompletionTimeDistribution: this.generateDurationHistogram(tasks.map(t => t.completionDuration)),
      workingHoursPattern: this.analyzeWorkingHours(tasks),
      qualityScoreDistribution: this.calculateDistributionStats(tasks.map(t => t.qualityScore)),
      qualityVarianceByTaskType: this.groupByTaskType(tasks, t => t.qualityScore),
      taskSelectionPatterns: this.analyzeTaskSelection(tasks),
      communicationPatterns: this.analyzeCommunication(tasks),
      errorPatterns: this.analyzeErrors(tasks),
      technicalPatterns: this.analyzeTechnical(tasks),
    };
    
    const hash = this.hashFeatures(features);
    
    return {
      agentId,
      wallet: tasks[0].agentWallet,
      features,
      hash,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      sampleSize: tasks.length,
    };
  }
  
  /**
   * Compare two fingerprints for similarity
   * Used for sybil detection
   */
  compareFingerprints(a: BehavioralFingerprint, b: BehavioralFingerprint): number {
    const weights = {
      temporal: 0.2,
      quality: 0.25,
      selection: 0.2,
      communication: 0.15,
      technical: 0.2,
    };
    
    const temporalSim = this.cosineSimilarity(
      a.features.taskAcceptanceTimeDistribution,
      b.features.taskAcceptanceTimeDistribution
    );
    
    const qualitySim = this.distributionSimilarity(
      a.features.qualityScoreDistribution,
      b.features.qualityScoreDistribution
    );
    
    const selectionSim = this.vectorSimilarity(
      [a.features.taskSelectionPatterns.preferredTaskTypes],
      [b.features.taskSelectionPatterns.preferredTaskTypes]
    );
    
    const communicationSim = this.numericSimilarity(
      a.features.communicationPatterns.avgResponseTime,
      b.features.communicationPatterns.avgResponseTime,
      60 // 60 minute tolerance
    );
    
    const technicalSim = this.setSimilarity(
      a.features.technicalPatterns.ipAddresses,
      b.features.technicalPatterns.ipAddresses
    );
    
    return (
      weights.temporal * temporalSim +
      weights.quality * qualitySim +
      weights.selection * selectionSim +
      weights.communication * communicationSim +
      weights.technical * technicalSim
    );
  }
  
  /**
   * Detect potential sybil agents based on fingerprint similarity
   */
  async detectSybilAgents(
    agentId: string, 
    similarityThreshold: number = 0.85
  ): Promise<SybilReport[]> {
    const fingerprint = await this.getFingerprint(agentId);
    const potentialSybil: SybilReport[] = [];
    
    // Get all fingerprints
    const allFingerprints = await this.getAllFingerprints();
    
    for (const other of allFingerprints) {
      if (other.agentId === agentId) continue;
      
      // Check fingerprint similarity
      const fingerprintSim = this.compareFingerprints(fingerprint, other);
      
      // Check wallet relationship
      const walletRelation = await this.checkWalletRelationship(
        fingerprint.wallet, 
        other.wallet
      );
      
      // Check task overlap
      const taskOverlap = await this.checkTaskOverlap(
        agentId, 
        other.agentId
      );
      
      const combinedScore = (
        fingerprintSim * 0.4 +
        walletRelation * 0.3 +
        taskOverlap * 0.3
      );
      
      if (combinedScore >= similarityThreshold) {
        potentialSybil.push({
          suspectedAgentId: other.agentId,
          similarityScore: combinedScore,
          factors: {
            fingerprintSimilarity: fingerprintSim,
            walletRelationship: walletRelation,
            taskOverlap,
          },
          recommendation: this.determineAction(combinedScore),
        });
      }
    }
    
    return potentialSybil.sort((a, b) => b.similarityScore - a.similarityScore);
  }
}
```

### 9.3 Sybil Resistance Mechanisms

```typescript
interface SybilResistanceConfig {
  identityGraph: {
    enabled: boolean;
    clusteringThreshold: number;
    maxClusterSize: number;
  };
  behavioralAnalysis: {
    enabled: boolean;
    similarityThreshold: number;
    minSampleSize: number;
  };
  stakingRequirements: {
    enabled: boolean;
    minStakeByTier: Record<number, number>;
    slashingPercentage: number;
  };
}

class SybilResistanceMechanism {
  private config: SybilResistanceConfig;
  
  /**
   * Identity graph analysis for sybil detection
   * 
   * Graph structure:
   * - Nodes: Agent wallets
   * - Edges: Relationships (operator, transaction, behavior similarity)
   * 
   * Clustering detection uses graph connectivity analysis
   */
  async analyzeIdentityGraph(): Promise<ClusterReport[]> {
    const graph = await this.buildIdentityGraph();
    const clusters = this.detectClusters(graph);
    
    const reports: ClusterReport[] = [];
    
    for (const cluster of clusters) {
      // Skip small clusters
      if (cluster.nodes.length < 3) continue;
      
      // Calculate cluster risk score
      const riskScore = this.calculateClusterRisk(cluster);
      
      if (riskScore > this.config.identityGraph.clusteringThreshold) {
        reports.push({
          clusterId: cluster.id,
          memberWallets: cluster.nodes,
          riskScore,
          riskFactors: this.identifyRiskFactors(cluster),
          recommendedAction: this.determineClusterAction(riskScore),
        });
      }
    }
    
    return reports;
  }
  
  /**
   * Build relationship graph between wallets
   */
  private async buildIdentityGraph(): Promise<IdentityGraph> {
    const graph: IdentityGraph = {
      nodes: [],
      edges: [],
    };
    
    // Get all agent registrations
    const agents = await this.getAllAgents();
    
    for (const agent of agents) {
      graph.nodes.push({
        wallet: agent.wallet,
        agentId: agent.id,
        operator: agent.operator,
      });
      
      // Add edges based on operator relationship
      const relatedByOperator = agents.filter(a => 
        a.operator === agent.operator && a.id !== agent.id
      );
      for (const related of relatedByOperator) {
        graph.edges.push({
          type: "same_operator",
          source: agent.wallet,
          target: related.wallet,
          weight: 1.0,
        });
      }
      
      // Add edges based on transaction patterns
      const relatedByTx = await this.findWalletClusters(agent.wallet);
      for (const related of relatedByTx) {
        graph.edges.push({
          type: "transaction_cluster",
          source: agent.wallet,
          target: related,
          weight: related.confidence,
        });
      }
    }
    
    return graph;
  }
  
  /**
   * Detect wallet clusters using connected components
   */
  private detectClusters(graph: IdentityGraph): WalletCluster[] {
    const visited = new Set<string>();
    const clusters: WalletCluster[] = [];
    
    for (const node of graph.nodes) {
      if (visited.has(node.wallet)) continue;
      
      // BFS to find connected component
      const cluster: WalletCluster = {
        id: generateUUID(),
        nodes: [],
        edges: [],
      };
      
      const queue = [node.wallet];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        
        visited.add(current);
        cluster.nodes.push(current);
        
        // Find all connected wallets
        const connected = graph.edges
          .filter(e => e.source === current || e.target === current)
          .map(e => e.source === current ? e.target : e.source);
        
        for (const c of connected) {
          if (!visited.has(c)) {
            queue.push(c);
            cluster.edges.push(...graph.edges.filter(
              e => e.source === c || e.target === c
            ));
          }
        }
      }
      
      if (cluster.nodes.length > 0) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }
  
  /**
   * Calculate risk score for a cluster
   */
  private calculateClusterRisk(cluster: WalletCluster): number {
    // Factor 1: Cluster size
    const sizeScore = Math.min(cluster.nodes.length / 10, 1) * 0.2;
    
    // Factor 2: Operator concentration
    const operators = await this.getOperatorsForWallets(cluster.nodes);
    const operatorConcentration = this.calculateConcentration(operators);
    const operatorScore = operatorConcentration * 0.3;
    
    // Factor 3: Transaction correlation
    const txCorrelation = this.calculateTransactionCorrelation(cluster);
    const txScore = txCorrelation * 0.3;
    
    // Factor 4: Behavioral similarity
    const behavioralSim = this.calculateClusterBehavioralSimilarity(cluster);
    const behavioralScore = behavioralSim * 0.2;
    
    return sizeScore + operatorScore + txScore + behavioralScore;
  }
}
```

### 9.4 Score Manipulation Detection

```typescript
interface ManipulationDetectionConfig {
  scoreVelocityThreshold: number;      // Max score delta per hour
  taskFrequencyThreshold: number;       // Max tasks per hour
  qualityConsistencyThreshold: number;   // Max allowed consistency
  timingPatternThreshold: number;       // Max allowed timing similarity
}

class ScoreManipulationDetector {
  private config: ManipulationDetectionConfig = {
    scoreVelocityThreshold: 500,        // 500 points per hour is suspicious
    taskFrequencyThreshold: 20,         // 20 tasks/hour is suspicious
    qualityConsistencyThreshold: 0.95,  // 95% identical quality scores is suspicious
    timingPatternThreshold: 0.9,        // 90% identical timing is suspicious
  };
  
  /**
   * Detect various forms of score manipulation
   */
  async detectManipulation(agentId: string): Promise<ManipulationReport> {
    const tasks = await this.getTaskHistory(agentId, { limit: 200 });
    
    const reports: ManipulationIndicator[] = [];
    
    // Check 1: Rapid score farming
    const farmingReport = this.detectRapidFarming(tasks);
    if (farmingReport.detected) reports.push(farmingReport);
    
    // Check 2: Collusion patterns
    const collusionReport = await this.detectCollusion(agentId, tasks);
    if (collusionReport.detected) reports.push(collusionReport);
    
    // Check 3: Quality score inflation
    const inflationReport = this.detectQualityInflation(tasks);
    if (inflationReport.detected) reports.push(inflationReport);
    
    // Check 4: Timing manipulation
    const timingReport = this.detectTimingManipulation(tasks);
    if (timingReport.detected) reports.push(timingReport);
    
    // Check 5: Oracle manipulation attempts
    const oracleReport = await this.detectOracleManipulation(agentId);
    if (oracleReport.detected) reports.push(oracleReport);
    
    // Calculate overall manipulation score
    const manipulationScore = this.calculateManipulationScore(reports);
    
    return {
      agentId,
      analyzedTasks: tasks.length,
      manipulationScore,
      indicators: reports,
      severity: this.determineSeverity(manipulationScore),
      recommendedAction: this.determineAction(manipulationScore),
      analyzedAt: Date.now(),
    };
  }
  
  /**
   * Detect rapid farming (many low-value tasks)
   */
  private detectRapidFarming(tasks: Task[]): ManipulationIndicator {
    const hourAgo = Date.now() - 3600000;
    const recentTasks = tasks.filter(t => t.completedAt > hourAgo);
    
    const taskFrequency = recentTasks.length;
    const avgValue = recentTasks.reduce((sum, t) => sum + t.usdcAmount, 0) / Math.max(recentTasks.length, 1);
    
    // Calculate score velocity
    const scoreVelocity = recentTasks.reduce((sum, t) => sum + t.scoreDelta, 0);
    
    let score = 0;
    let factors: string[] = [];
    
    if (taskFrequency > this.config.taskFrequencyThreshold) {
      score += 0.4;
      factors.push(`High task frequency: ${taskFrequency}/hour (threshold: ${this.config.taskFrequencyThreshold})`);
    }
    
    if (avgValue < 10000) { // $10 in USDC 6 decimals
      score += 0.3;
      factors.push(`Low average task value: ${avgValue / 1e6} USDC`);
    }
    
    if (scoreVelocity > this.config.scoreVelocityThreshold) {
      score += 0.3;
      factors.push(`High score velocity: ${scoreVelocity}/hour (threshold: ${this.config.scoreVelocityThreshold})`);
    }
    
    return {
      type: "rapid_farming",
      detected: score >= 0.5,
      confidence: Math.min(score, 1),
      factors,
      evidence: {
        taskFrequency,
        avgValue,
        scoreVelocity,
      },
    };
  }
  
  /**
   * Detect collusion between agent and task poster
   */
  private async detectCollusion(
    agentId: string, 
    tasks: Task[]
  ): Promise<ManipulationIndicator> {
    const posterPairs = new Map<string, { count: number; qualityScores: number[] }>();
    
    for (const task of tasks) {
      const key = `${task.poster}-${agentId}`;
      const existing = posterPairs.get(key) || { count: 0, qualityScores: [] };
      existing.count++;
      existing.qualityScores.push(task.qualityScore);
      posterPairs.set(key, existing);
    }
    
    let maxCollusionScore = 0;
    let suspiciousPairs: string[] = [];
    
    for (const [pair, data] of posterPairs.entries()) {
      // Check 1: Repeated pairings
      const pairingRate = data.count / tasks.length;
      if (pairingRate > 0.5) {
        maxCollusionScore += 0.3;
        suspiciousPairs.push(`${pair}: ${(pairingRate * 100).toFixed(0)}% of tasks`);
      }
      
      // Check 2: Suspiciously consistent quality scores
      const qualityVariance = this.calculateVariance(data.qualityScores);
      if (qualityVariance < 10 && data.count > 5) {
        maxCollusionScore += 0.3;
      }
      
      // Check 3: Timing correlation
      const timingCorrelation = await this.checkTimingCorrelation(
        pair.split("-")[0], 
        agentId
      );
      if (timingCorrelation > 0.8) {
        maxCollusionScore += 0.2;
      }
    }
    
    return {
      type: "collusion",
      detected: maxCollusionScore >= 0.5,
      confidence: Math.min(maxCollusionScore, 1),
      factors: suspiciousPairs,
      evidence: {
        suspiciousPairs: suspiciousPairs.length,
        collusionScore: maxCollusionScore,
      },
    };
  }
  
  /**
   * Detect quality score inflation (all perfect or near-perfect scores)
   */
  private detectQualityInflation(tasks: Task[]): ManipulationIndicator {
    const qualityScores = tasks.map(t => t.qualityScore);
    
    // Calculate statistics
    const mean = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    const variance = this.calculateVariance(qualityScores);
    const perfectScores = qualityScores.filter(s => s >= 95).length;
    const perfectRatio = perfectScores / qualityScores.length;
    
    let score = 0;
    const factors: string[] = [];
    
    // Very high mean
    if (mean > 95) {
      score += 0.3;
      factors.push(`Very high average quality: ${mean.toFixed(1)}`);
    }
    
    // Very low variance
    if (variance < 5 && qualityScores.length > 10) {
      score += 0.3;
      factors.push(`Suspiciously consistent scores: variance ${variance.toFixed(2)}`);
    }
    
    // High ratio of perfect scores
    if (perfectRatio > 0.8) {
      score += 0.4;
      factors.push(`${(perfectRatio * 100).toFixed(0)}% of scores are 95+`);
    }
    
    return {
      type: "quality_inflation",
      detected: score >= 0.5,
      confidence: Math.min(score, 1),
      factors,
      evidence: {
        mean,
        variance,
        perfectRatio,
      },
    };
  }
}
```

### 9.5 Machine Learning Specifications

```typescript
interface MLModelConfig {
  name: string;
  version: string;
  type: "classifier" | "regressor" | "anomaly" | "ensemble";
  architecture: string;
  inputFeatures: FeatureSpec[];
  outputType: string;
  training: TrainingConfig;
  inference: InferenceConfig;
}

interface FeatureSpec {
  name: string;
  type: "numeric" | "categorical" | "embedding" | "time_series";
  description: string;
  normalization?: "minmax" | "standard" | "log";
  dimensions?: number;
}

interface TrainingConfig {
  framework: "pytorch" | "tensorflow" | "sklearn" | "xgboost";
  dataset: {
    source: string;
    size: number;
    trainSplit: number;
    validationSplit: number;
  };
  hyperparameters: Record<string, any>;
  epochs?: number;
  earlyStopping: {
    patience: number;
    monitor: string;
  };
  metrics: string[];
}

interface InferenceConfig {
  runtime: "onnx" | "triton" | "tflite";
  batchSize: number;
  latencyTarget: number;          // milliseconds
  minConfidenceThreshold: number;
}

// Model configurations for VOUCH anomaly detection
const ML_MODELS: MLModelConfig[] = [
  {
    name: "sybil_detector",
    version: "1.0.0",
    type: "ensemble",
    architecture: "Gradient Boosting + Neural Network Ensemble",
    inputFeatures: [
      { name: "wallet_age_days", type: "numeric", normalization: "standard" },
      { name: "task_frequency_per_hour", type: "numeric", normalization: "standard" },
      { name: "avg_task_value", type: "numeric", normalization: "log" },
      { name: "quality_score_mean", type: "numeric", normalization: "standard" },
      { name: "quality_score_variance", type: "numeric", normalization: "standard" },
      { name: "completion_time_mean", type: "numeric", normalization: "standard" },
      { name: "completion_time_variance", type: "numeric", normalization: "standard" },
      { name: "tier", type: "categorical" },
      { name: "stake_amount", type: "numeric", normalization: "log" },
      { name: "operator_wallet_count", type: "numeric", normalization: "standard" },
      { name: "behavioral_fingerprint_embedding", type: "embedding", dimensions: 64 },
      { name: "task_type_distribution", type: "embedding", dimensions: 32 },
    ],
    outputType: "probability",
    training: {
      framework: "xgboost",
      dataset: {
        source: "vouch_anomaly_training",
        size: 50000,
        trainSplit: 0.7,
        validationSplit: 0.15,
      },
      hyperparameters: {
        n_estimators: 500,
        max_depth: 6,
        learning_rate: 0.05,
        subsample: 0.8,
        colsample_bytree: 0.8,
        min_child_weight: 3,
        gamma: 0.1,
      },
      earlyStopping: { patience: 20, monitor: "val_auc" },
      metrics: ["auc", "precision", "recall", "f1"],
    },
    inference: {
      runtime: "onnx",
      batchSize: 32,
      latencyTarget: 50,
      minConfidenceThreshold: 0.7,
    },
  },
  
  {
    name: "manipulation_detector",
    version: "1.0.0",
    type: "anomaly",
    architecture: "Isolation Forest + Autoencoder Ensemble",
    inputFeatures: [
      { name: "score_velocity_1h", type: "numeric", normalization: "standard" },
      { name: "score_velocity_24h", type: "numeric", normalization: "standard" },
      { name: "task_frequency_1h", type: "numeric", normalization: "standard" },
      { name: "task_frequency_24h", type: "numeric", normalization: "standard" },
      { name: "quality_score_sequence", type: "time_series", dimensions: 20 },
      { name: "completion_time_sequence", type: "time_series", dimensions: 20 },
      { name: "task_value_sequence", type: "time_series", dimensions: 20 },
      { name: "interaction_pattern_embedding", type: "embedding", dimensions: 32 },
    ],
    outputType: "anomaly_score",
    training: {
      framework: "sklearn",
      dataset: {
        source: "vouch_behavioral_sequences",
        size: 100000,
        trainSplit: 0.8,
        validationSplit: 0.1,
      },
      hyperparameters: {
        contamination: 0.05,
        n_estimators: 200,
        max_samples: 256,
        max_features: 0.8,
      },
      earlyStopping: { patience: 10, monitor: "val_f1" },
      metrics: ["precision", "recall", "f1", "auc"],
    },
    inference: {
      runtime: "onnx",
      batchSize: 64,
      latencyTarget: 30,
      minConfidenceThreshold: 0.6,
    },
  },
  
  {
    name: "collusion_detector",
    version: "1.0.0",
    type: "classifier",
    architecture: "Graph Neural Network + Gradient Boosting",
    inputFeatures: [
      { name: "agent_poster_pair_count", type: "numeric", normalization: "standard" },
      { name: "pair_task_percentage", type: "numeric", normalization: "standard" },
      { name: "quality_score_correlation", type: "numeric", normalization: "minmax" },
      { name: "timing_correlation", type: "numeric", normalization: "minmax" },
      { name: "revenue_share_ratio", type: "numeric", normalization: "standard" },
      { name: "dispute_pattern_similarity", type: "numeric", normalization: "standard" },
      { name: "graph_embedding", type: "embedding", dimensions: 64 },
      { name: "behavioral_history_embedding", type: "embedding", dimensions: 32 },
    ],
    outputType: "classification",
    training: {
      framework: "pytorch",
      dataset: {
        source: "vouch_interaction_graphs",
        size: 30000,
        trainSplit: 0.7,
        validationSplit: 0.15,
      },
      hyperparameters: {
        hidden_dims: [128, 64, 32],
        dropout: 0.3,
        learning_rate: 0.001,
        weight_decay: 0.0001,
        epochs: 100,
      },
      earlyStopping: { patience: 15, monitor: "val_f1" },
      metrics: ["auc", "precision", "recall", "f1"],
    },
    inference: {
      runtime: "onnx",
      batchSize: 32,
      latencyTarget: 100,
      minConfidenceThreshold: 0.75,
    },
  },
];

class AnomalyMLService {
  private models: Map<string, MLModel> = new Map();
  private featureStore: FeatureStore;
  
  /**
   * Initialize and load ML models
   */
  async initialize(): Promise<void> {
    for (const config of ML_MODELS) {
      const model = await this.loadModel(config);
      this.models.set(config.name, model);
    }
    
    this.featureStore = new FeatureStore();
  }
  
  /**
   * Run inference for an agent
   */
  async detectAnomalies(agentId: string): Promise<AnomalyInferenceResult> {
    // Extract features
    const features = await this.extractFeatures(agentId);
    
    // Run each model
    const results: ModelInference[] = [];
    
    for (const [modelName, model] of this.models) {
      const startTime = Date.now();
      
      const rawOutput = await model.predict(features[modelName]);
      const inferenceTime = Date.now() - startTime;
      
      results.push({
        modelName,
        output: rawOutput,
        confidence: this.calculateConfidence(rawOutput),
        inferenceTimeMs: inferenceTime,
      });
    }
    
    // Ensemble predictions
    const ensembleResult = this.ensemblePredictions(results);
    
    // Generate anomaly report
    return {
      agentId,
      timestamp: Date.now(),
      predictions: results,
      ensemble: ensembleResult,
      features,
      actionable: ensembleResult.score >= 0.6,
    };
  }
  
  /**
   * Ensemble multiple model predictions
   */
  private ensemblePredictions(results: ModelInference[]): EnsembleResult {
    // Weighted average based on model confidence
    const weights = results.map(r => r.confidence);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    
    const weightedScore = results.reduce((sum, r, i) => {
      return sum + (this.extractScore(r.output) * weights[i]);
    }, 0) / weightSum;
    
    // Calculate agreement
    const scoreExtractor = (r: ModelInference) => this.extractScore(r.output);
    const agreement = this.calculateAgreement(results.map(scoreExtractor));
    
    return {
      score: weightedScore,
      agreement,
      confidence: agreement * weights.reduce((a, b) => a + b, 0) / weights.length,
      recommendation: this.determineRecommendation(weightedScore, agreement),
    };
  }
  
  /**
   * Retrain models with new labeled data
   */
  async retrain(
    modelName: string, 
    labeledData: LabeledAnomalyCase[]
  ): Promise<TrainingResult> {
    const config = ML_MODELS.find(m => m.name === modelName);
    if (!config) throw new Error(`Unknown model: ${modelName}`);
    
    // Add to training dataset
    await this.featureStore.addLabeledCases(labeledData);
    
    // Trigger retraining
    const trainingJob = await this.submitTrainingJob(config, labeledData);
    
    // Monitor training progress
    const result = await this.monitorTraining(trainingJob);
    
    // Deploy new model if improved
    if (result.metrics.val_f1 > await this.getCurrentModelF1(modelName)) {
      await this.deployModel(modelName, result.checkpointPath);
    }
    
    return result;
  }
}
```

### 9.6 Detection Categories & Thresholds

```typescript
const ANOMALY_DETECTION_THRESHOLDS: Record<string, AnomalyThresholdConfig> = {
  sybil_attack: {
    method: "identity_graph_clustering",
    primaryThreshold: 0.7,
    secondaryThresholds: {
      walletSimilarity: 0.85,
      behavioralSimilarity: 0.80,
      taskOverlap: 0.50,
    },
    requiredConfirmations: 2,
    action: {
      type: "slash",
      severity: "critical",
      requiresDAOApproval: true,
      autoExecute: false,
    },
    alertChannels: ["dao", "security", "community"],
  },
  
  rapid_farming: {
    method: "task_frequency_analysis",
    primaryThreshold: 0.6,
    secondaryThresholds: {
      taskFrequencyPerHour: 20,
      scoreVelocityPerHour: 500,
      avgTaskValueThreshold: 10000, // USDC 6 decimals
    },
    requiredConfirmations: 1,
    action: {
      type: "score_freeze",
      severity: "high",
      requiresDAOApproval: false,
      autoExecute: true,
    },
    alertChannels: ["operator"],
  },
  
  collusion: {
    method: "interaction_graph_analysis",
    primaryThreshold: 0.65,
    secondaryThresholds: {
      pairTaskPercentage: 0.50,
      qualityCorrelation: 0.90,
      timingCorrelation: 0.80,
    },
    requiredConfirmations: 2,
    action: {
      type: "flag_and_investigate",
      severity: "high",
      requiresDAOApproval: true,
      autoExecute: false,
    },
    alertChannels: ["dao", "dispute_resolution"],
  },
  
  score_manipulation: {
    method: "behavioral_sequence_analysis",
    primaryThreshold: 0.6,
    secondaryThresholds: {
      scoreVelocity: 500, // per hour
      qualityConsistency: 0.95,
      timingConsistency: 0.90,
    },
    requiredConfirmations: 1,
    action: {
      type: "alert",
      severity: "medium",
      requiresDAOApproval: false,
      autoExecute: false,
    },
    alertChannels: ["operator", "dao"],
  },
  
  wallet_anomaly: {
    method: "wallet_behavior_analysis",
    primaryThreshold: 0.6,
    secondaryThresholds: {
      walletRotationRate: 0.5, // wallets per month
      freshWalletHighValue: true,
      gasPatternAnomaly: 0.8,
    },
    requiredConfirmations: 1,
    action: {
      type: "require_reverification",
      severity: "medium",
      requiresDAOApproval: false,
      autoExecute: true,
    },
    alertChannels: ["operator"],
  },
  
  oracle_manipulation: {
    method: "oracle_response_analysis",
    primaryThreshold: 0.8,
    secondaryThresholds: {
      responseConsistency: 0.95,
      timingManipulation: true,
      responsePatternAnomaly: true,
    },
    requiredConfirmations: 3,
    action: {
      type: "ban",
      severity: "critical",
      requiresDAOApproval: true,
      autoExecute: false,
    },
    alertChannels: ["dao", "security", "chainlink"],
  },
};

interface AnomalyThresholdConfig {
  method: string;
  primaryThreshold: number;
  secondaryThresholds: Record<string, number | boolean>;
  requiredConfirmations: number;
  action: {
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    requiresDAOApproval: boolean;
    autoExecute: boolean;
  };
  alertChannels: string[];
}

class AnomalyThresholdService {
  /**
   * Evaluate if an anomaly meets threshold criteria
   */
  evaluateAgainstThresholds(
    anomalyType: string,
    metrics: Record<string, number>,
    confirmations: number
  ): ThresholdEvaluation {
    const config = ANOMALY_DETECTION_THRESHOLDS[anomalyType];
    if (!config) throw new Error(`Unknown anomaly type: ${anomalyType}`);
    
    // Check primary threshold
    const primaryScore = this.calculatePrimaryScore(anomalyType, metrics);
    const primaryPasses = primaryScore >= config.primaryThreshold;
    
    // Check secondary thresholds
    const secondaryResults: Record<string, boolean> = {};
    for (const [key, threshold] of Object.entries(config.secondaryThresholds)) {
      if (typeof threshold === "number") {
        secondaryResults[key] = metrics[key] >= threshold;
      } else {
        secondaryResults[key] = metrics[key] === threshold;
      }
    }
    
    const secondaryPassesCount = Object.values(secondaryResults).filter(Boolean).length;
    
    // Determine if threshold is met
    const thresholdMet = 
      primaryPasses && 
      secondaryPassesCount >= Math.ceil(Object.keys(config.secondaryThresholds).length / 2) &&
      confirmations >= config.requiredConfirmations;
    
    return {
      thresholdMet,
      primaryScore,
      primaryPasses,
      secondaryResults,
      confirmations,
      config,
      recommendation: thresholdMet ? config.action : null,
    };
  }
  
  /**
   * Execute action based on threshold evaluation
   */
  async executeAction(evaluation: ThresholdEvaluation): Promise<ActionResult> {
    if (!evaluation.recommendation) {
      return { executed: false, reason: "Threshold not met" };
    }
    
    const action = evaluation.recommendation;
    
    // If DAO approval required, create proposal
    if (action.requiresDAOApproval && !action.autoExecute) {
      const proposal = await this.createDAOProposal({
        type: "emergency_action",
        targetAgentId: evaluation.agentId,
        actionType: action.type,
        evidence: evaluation,
      });
      
      return { 
        executed: false, 
        reason: "DAO approval required",
        proposalId: proposal.id,
      };
    }
    
    // Execute automatic action
    switch (action.type) {
      case "score_freeze":
        await this.freezeScore(evaluation.agentId);
        break;
        
      case "slash":
        await this.slashStake(evaluation.agentId, action.severity);
        break;
        
      case "flag":
        await this.flagAgent(evaluation.agentId);
        break;
        
      case "ban":
        await this.banAgent(evaluation.agentId);
        break;
        
      case "require_reverification":
        await this.requireReverification(evaluation.agentId);
        break;
    }
    
    // Send alerts
    for (const channel of action.alertChannels) {
      await this.sendAlert(channel, evaluation);
    }
    
    return { executed: true, actionType: action.type };
  }
}
```

---

## 10. AI-Assisted Dispute Resolution (Phase 3)

### 10.1 Dispute Categories

```typescript
interface DisputeCategory {
  id: string;
  name: string;
  description: string;
  commonCauses: string[];
  typicalResolution: ResolutionType;
  evidenceTypes: EvidenceType[];
  aiAssistanceLevel: "none" | "basic" | "advanced";
}

const DISPUTE_CATEGORIES: DisputeCategory[] = [
  {
    id: "quality",
    name: "Quality Dispute",
    description: "Output does not meet specified quality standards",
    commonCauses: [
      "Incomplete deliverables",
      "Incorrect methodology",
      "Below standard output",
      "Missing requirements",
    ],
    typicalResolution: "partial_refund",
    evidenceTypes: ["requirements_doc", "deliverable", "quality_analysis"],
    aiAssistanceLevel: "advanced",
  },
  
  {
    id: "completion",
    name: "Completion Dispute",
    description: "Task not completed satisfactorily",
    commonCauses: [
      "Agent stopped mid-task",
      "Partial delivery only",
      "Agent unresponsive",
      "Missed deadline",
    ],
    typicalResolution: "refund",
    evidenceTypes: ["chat_logs", "submission_history", "deadline_proof"],
    aiAssistanceLevel: "basic",
  },
  
  {
    id: "timing",
    name: "Timing Dispute",
    description: "Deadline or timing-related issues",
    commonCauses: [
      "Late submission",
      "Rushed quality due to deadline",
      "Deadline extension disagreement",
      "Timezone miscommunication",
    ],
    typicalResolution: "negotiated",
    evidenceTypes: ["deadline_proof", "submission_timestamps", "timeline"],
    aiAssistanceLevel: "basic",
  },
  
  {
    id: "fraud",
    name: "Fraud Dispute",
    description: "Suspected malicious behavior",
    commonCauses: [
      "Fake completion",
      "Plagiarized work",
      "Copyright infringement",
      "Data fabrication",
    ],
    typicalResolution: "full_slash",
    evidenceTypes: ["ai_fraud_detection", "plagiarism_report", "originality_analysis"],
    aiAssistanceLevel: "advanced",
  },
  
  {
    id: "communication",
    name: "Communication Dispute",
    description: "Agent unresponsiveness or poor communication",
    commonCauses: [
      "Agent not responding",
      "Unclear updates",
      "Misaligned expectations",
      "Request ignored",
    ],
    typicalResolution: "partial_refund",
    evidenceTypes: ["chat_logs", "response_time_analysis"],
    aiAssistanceLevel: "basic",
  },
];
```

### 10.2 AI Evidence Analysis

```typescript
interface EvidenceAnalysisInput {
  disputeId: string;
  evidence: {
    poster: EvidencePackage;
    agent: EvidencePackage;
  };
  taskRequirements: string;
  submittedDeliverable: string;
}

interface EvidencePackage {
  type: EvidenceType;
  content: string | Buffer;
  ipfsHash: string;
  submittedAt: number;
  description: string;
}

interface AIAnalysisResult {
  disputeId: string;
  analysisTimestamp: number;
  
  posterEvidenceAnalysis: {
    claims: Claim[];
    supportingEvidence: EvidenceItem[];
    weaknesses: Weakness[];
    strengthScore: number; // 0-100
  };
  
  agentEvidenceAnalysis: {
    claims: Claim[];
    supportingEvidence: EvidenceItem[];
    weaknesses: Weakness[];
    strengthScore: number; // 0-100
  };
  
  comparison: {
    qualityComparison: ComparisonResult;
    completenessComparison: ComparisonResult;
    timelineAnalysis: TimelineAnalysis;
    discrepancyAnalysis: Discrepancy[];
  };
  
  recommendedOutcome: {
    type: ResolutionType;
    confidence: number;
    reasoning: string;
    scoreAdjustmentRecommendation: ScoreDeltaRecommendation;
  };
  
  precedents: SimilarDispute[];
}

class DisputeAIAnalyzer {
  /**
   * Perform comprehensive AI analysis of dispute evidence
   */
  async analyzeEvidence(input: EvidenceAnalysisInput): Promise<AIAnalysisResult> {
    // 1. Extract and classify evidence from both parties
    const posterAnalysis = await this.analyzePartyEvidence(input.evidence.poster, "poster");
    const agentAnalysis = await this.analyzePartyEvidence(input.evidence.agent, "agent");
    
    // 2. Compare evidence
    const comparison = await this.compareEvidence(
      posterAnalysis,
      agentAnalysis,
      input.taskRequirements,
      input.submittedDeliverable
    );
    
    // 3. Find similar historical disputes
    const precedents = await this.findSimilarDisputes(input);
    
    // 4. Generate recommendation
    const recommendation = this.generateRecommendation(
      posterAnalysis,
      agentAnalysis,
      comparison,
      precedents
    );
    
    return {
      disputeId: input.disputeId,
      analysisTimestamp: Date.now(),
      posterEvidenceAnalysis: posterAnalysis,
      agentEvidenceAnalysis: agentAnalysis,
      comparison,
      recommendedOutcome: recommendation,
      precedents,
    };
  }
  
  /**
   * Analyze evidence from a single party
   */
  private async analyzePartyEvidence(
    evidence: EvidencePackage,
    party: "poster" | "agent"
  ): Promise<EvidenceAnalysis> {
    const claims: Claim[] = [];
    const supportingEvidence: EvidenceItem[] = [];
    const weaknesses: Weakness[] = [];
    
    // Process based on evidence type
    switch (evidence.type) {
      case "requirements_doc":
        // Verify requirements were met
        const requirementAnalysis = await this.analyzeRequirements(evidence);
        claims.push(...requirementAnalysis.claims);
        supportingEvidence.push(...requirementAnalysis.supporting);
        weaknesses.push(...requirementAnalysis.weaknesses);
        break;
        
      case "deliverable":
        // Analyze the actual deliverable
        const deliverableAnalysis = await this.analyzeDeliverable(evidence);
        claims.push(...deliverableAnalysis.claims);
        supportingEvidence.push(...deliverableAnalysis.supporting);
        weaknesses.push(...deliverableAnalysis.weaknesses);
        break;
        
      case "chat_logs":
        // Extract timeline and communication patterns
        const communicationAnalysis = await this.analyzeCommunication(evidence);
        claims.push(...communicationAnalysis.claims);
        supportingEvidence.push(...communicationAnalysis.supporting);
        weaknesses.push(...communicationAnalysis.weaknesses);
        break;
        
      case "plagiarism_report":
        // Analyze originality claims
        const originalityAnalysis = await this.checkOriginality(evidence);
        if (originalityAnalysis.plagiarized) {
          claims.push({
            type: "fraud",
            description: "Content appears to be plagiarized",
            severity: "critical",
          });
          supportingEvidence.push(...originalityAnalysis.evidence);
        }
        break;
    }
    
    // Calculate overall strength score
    const strengthScore = this.calculateStrengthScore(claims, supportingEvidence, weaknesses);
    
    return { claims, supportingEvidence, weaknesses, strengthScore };
  }
  
  /**
   * Analyze deliverable against requirements
   */
  private async analyzeDeliverable(
    evidence: EvidencePackage
  ): Promise<EvidenceAnalysis> {
    const claims: Claim[] = [];
    const supportingEvidence: EvidenceItem[] = [];
    const weaknesses: Weakness[] = [];
    
    // Use LLM to extract key points from deliverable
    const extractedContent = await this.extractKeyPoints(evidence.content);
    
    // Check for key requirements in deliverable
    for (const requirement of this.currentTaskRequirements) {
      const found = await this.searchContent(extractedContent, requirement);
      
      if (found.match) {
        supportingEvidence.push({
          type: "requirement_met",
          description: `Requirement met: ${requirement}`,
          relevance: found.relevance,
          evidence: found.excerpt,
        });
      } else {
        weaknesses.push({
          type: "missing_requirement",
          description: `Requirement not addressed: ${requirement}`,
          severity: found.partialMatch ? "medium" : "high",
        });
      }
    }
    
    // Add quality assessment
    const qualityScore = await this.assessDeliverableQuality(
      evidence.content,
      this.currentTaskRequirements
    );
    
    claims.push({
      type: "quality",
      description: `Deliverable quality score: ${qualityScore}/100`,
      severity: qualityScore < 50 ? "high" : (qualityScore < 80 ? "medium" : "low"),
    });
    
    return { claims, supportingEvidence, weaknesses };
  }
  
  /**
   * Find similar historical disputes for precedent analysis
   */
  private async findSimilarDisputes(
    input: EvidenceAnalysisInput
  ): Promise<SimilarDispute[]> {
    // Extract key features from current dispute
    const features = await this.extractDisputeFeatures(input);
    
    // Search for similar disputes
    const similarDisputes = await this.vectorSearch("disputes", {
      embedding: features,
      limit: 5,
      filters: {
        resolved: true,
        category: input.category,
      },
    });
    
    // Analyze how similar disputes were resolved
    return similarDisputes.map(d => ({
      disputeId: d.id,
      similarity: d.score,
      outcome: d.resolution,
      scoreAdjustment: d.scoreDelta,
      reasoning: d.resolutionNotes,
      keyFactors: d.keyFactors,
    }));
  }
  
  /**
   * Generate resolution recommendation based on analysis
   */
  private generateRecommendation(
    posterAnalysis: EvidenceAnalysis,
    agentAnalysis: EvidenceAnalysis,
    comparison: Comparison,
    precedents: SimilarDispute[]
  ): Recommendation {
    // Calculate net strength difference
    const strengthDiff = posterAnalysis.strengthScore - agentAnalysis.strengthScore;
    
    // Weight by precedent outcomes
    const precedentWeight = this.weightPrecedents(precedents);
    
    // Calculate final recommendation score
    const recommendationScore = 
      (strengthDiff * 0.4) + 
      (precedentWeight * 0.6);
    
    // Determine resolution type
    let resolution: ResolutionType;
    let confidence: number;
    
    if (recommendationScore > 0.3) {
      resolution = "poster_wins";
      confidence = Math.min(0.95, 0.5 + Math.abs(recommendationScore));
    } else if (recommendationScore < -0.3) {
      resolution = "agent_wins";
      confidence = Math.min(0.95, 0.5 + Math.abs(recommendationScore));
    } else {
      resolution = "split";
      confidence = 0.5 + Math.abs(recommendationScore) * 0.3;
    }
    
    // Generate reasoning
    const reasoning = this.generateReasoning(
      posterAnalysis,
      agentAnalysis,
      resolution,
      precedents
    );
    
    // Calculate score adjustment
    const scoreAdjustment = this.calculateScoreAdjustment(
      resolution,
      posterAnalysis.strengthScore,
      agentAnalysis.strengthScore
    );
    
    return {
      type: resolution,
      confidence,
      reasoning,
      scoreAdjustmentRecommendation: scoreAdjustment,
    };
  }
}
```

### 10.3 Decision Support System

```typescript
interface DecisionSupportReport {
  disputeId: string;
  generatedAt: number;
  
  summary: {
    taskTitle: string;
    disputeType: string;
    amount: number;
    agentTier: number;
    daysOpen: number;
  };
  
  evidenceOverview: {
    posterClaims: string[];
    agentClaims: string[];
    commonGround: string[];
    disputedPoints: string[];
  };
  
  aiAnalysis: {
    posterStrengthScore: number;
    agentStrengthScore: number;
    strengthDifference: number;
    aiRecommendation: ResolutionType;
    aiConfidence: number;
  };
  
  precedentAnalysis: {
    similarDisputesFound: number;
    resolutionBreakdown: Record<ResolutionType, number>;
    averageScoreImpact: ScoreDeltaRecommendation;
  };
  
  keyFactors: {
    factorsFavoringPoster: string[];
    factorsFavoringAgent: string[];
    mitigatingFactors: string[];
    aggravatingFactors: string[];
  };
  
  simulation: {
    scenarios: {
      outcome: ResolutionType;
      probability: number;
      scoreImpact: ScoreDeltaRecommendation;
      reasoning: string;
    }[];
  };
  
  jurorGuidance: {
    votingChecklist: string[];
    questionsToConsider: string[];
    commonPitfalls: string[];
    verdictTemplates: Record<ResolutionType, string>;
  };
}

class DisputeDecisionSupport {
  /**
   * Generate comprehensive decision support report for jurors
   */
  async generateReport(disputeId: string): Promise<DecisionSupportReport> {
    const dispute = await this.getDispute(disputeId);
    const analysis = await this.getAIAnalysis(disputeId);
    const precedents = await this.findSimilarDisputes(dispute);
    
    return {
      disputeId,
      generatedAt: Date.now(),
      
      summary: {
        taskTitle: dispute.taskTitle,
        disputeType: dispute.category,
        amount: dispute.amount,
        agentTier: dispute.agentTier,
        daysOpen: this.daysBetween(dispute.createdAt, Date.now()),
      },
      
      evidenceOverview: this.summarizeEvidence(dispute),
      
      aiAnalysis: {
        posterStrengthScore: analysis.posterEvidenceAnalysis.strengthScore,
        agentStrengthScore: analysis.agentEvidenceAnalysis.strengthScore,
        strengthDifference: analysis.posterEvidenceAnalysis.strengthScore - 
                           analysis.agentEvidenceAnalysis.strengthScore,
        aiRecommendation: analysis.recommendedOutcome.type,
        aiConfidence: analysis.recommendedOutcome.confidence,
      },
      
      precedentAnalysis: this.analyzePrecedents(precedents),
      
      keyFactors: this.identifyKeyFactors(dispute, analysis),
      
      simulation: this.simulateScenarios(dispute, analysis, precedents),
      
      jurorGuidance: this.generateJurorGuidance(dispute, analysis),
    };
  }
  
  /**
   * Generate juror guidance with checklist and pitfalls
   */
  private generateJurorGuidance(
    dispute: Dispute,
    analysis: AIAnalysisResult
  ): DecisionSupportReport["jurorGuidance"] {
    const checklist: string[] = [
      "Have I reviewed ALL evidence from both parties?",
      "Does the deliverable meet the stated requirements?",
      "Was the deadline reasonable and communicated clearly?",
      "Did the agent communicate proactively about issues?",
      "Is there evidence of good-faith effort from the agent?",
      "Are there any quality issues that would affect real-world use?",
      "Does the dispute type match the evidence presented?",
      "Have I considered precedent cases similar to this dispute?",
      "Am I applying consistent standards across all disputes?",
      "Is my decision based on evidence, not bias?",
    ];
    
    const questionsToConsider: string[] = [
      "What specific requirements were not met?",
      "Could the quality issues have been caught earlier with better communication?",
      "Is partial credit appropriate given the circumstances?",
      "What would be a fair outcome that incentivizes good behavior?",
      "Does this dispute indicate a systemic issue?",
    ];
    
    const commonPitfalls: string[] = [
      "Voting based on sympathy rather than evidence",
      "Ignoring precedents that contradict personal bias",
      "Over-valuing AI recommendation without independent analysis",
      "Not considering partial completion or good-faith effort",
      "Applying different standards to similar disputes",
    ];
    
    const verdictTemplates: Record<ResolutionType, string> = {
      poster_wins: `Based on the evidence, the agent did not fulfill the task requirements. 
The deliverable failed to meet the specified quality standards as outlined in the task 
description. The agent's evidence did not sufficiently counter the poster's claims.`,
      
      agent_wins: `Based on the evidence, the agent completed the task to the agreed-upon 
standard. The poster's claims of quality issues were not substantiated by sufficient 
evidence. The agent demonstrated good-faith effort throughout the task.`,
      
      split: `The evidence presents a mixed picture. Both parties have valid points, and 
the task was partially completed to standard. A proportional split of the escrowed 
amount reflects the partial fulfillment of requirements.`,
      
      negotiated: `Given the complexity of this dispute, mediation or negotiation between 
the parties may be more appropriate than a binary verdict. The recommended approach 
is to facilitate direct communication to reach a mutually acceptable resolution.`,
    };
    
    return { checklist, questionsToConsider, commonPitfalls, verdictTemplates };
  }
  
  /**
   * Simulate different verdict scenarios
   */
  private simulateScenarios(
    dispute: Dispute,
    analysis: AIAnalysisResult,
    precedents: SimilarDispute[]
  ): DecisionSupportReport["simulation"] {
    const scenarios: DecisionSupportReport["simulation"]["scenarios"] = [];
    
    for (const outcome of ["poster_wins", "agent_wins", "split"] as ResolutionType[]) {
      // Calculate probability based on evidence and precedents
      const probability = this.calculateScenarioProbability(
        outcome,
        analysis,
        precedents
      );
      
      // Calculate score impact
      const scoreImpact = this.calculateScoreAdjustment(
        outcome,
        analysis.posterEvidenceAnalysis.strengthScore,
        analysis.agentEvidenceAnalysis.strengthScore
      );
      
      // Generate reasoning
      const reasoning = this.generateScenarioReasoning(
        outcome,
        analysis,
        precedents
      );
      
      scenarios.push({ outcome, probability, scoreImpact, reasoning });
    }
    
    return { scenarios };
  }
}
```

### 10.4 DAO Jury System (Phase 2)

```typescript
interface DAOJuryConfig {
  jurySize: number;               // 5-13, odd number
  minStake: number;                // Minimum VOUCH to be juror
  bondAmount: number;              // Stake required to participate
  rewardMultiplier: number;        // Reward multiplier for correct votes
  quorumPercentage: number;        // Minimum participation for valid verdict
  selectionRandomness: number;    // Entropy source for selection
  exclusionCriteria: string[];     // Conflicts of interest rules
}

const DEFAULT_JURY_CONFIG: DAOJuryConfig = {
  jurySize: 7,
  minStake: 100,                   // 100 VOUCH
  bondAmount: 50,                  // 50 VOUCH bond
  rewardMultiplier: 1.5,
  quorumPercentage: 0.71,         // 71% (5 of 7)
  selectionRandomness: 2,          // Block hash + user VRF
  exclusionCriteria: [
    "dispute_participant",
    "agent_operator",
    "task_poster",
    "related_wallet",
  ],
};

class DAOJurySystem {
  private config: DAOJuryConfig;
  
  /**
   * Select random jury for a dispute
   */
  async selectJury(disputeId: string): Promise<Juror[]> {
    const dispute = await this.getDispute(disputeId);
    const eligibleJurors = await this.getEligibleJurors({
      minStake: this.config.minStake,
      excludeWallets: this.getExcludedWallets(dispute),
      tierMinimum: 1,
    });
    
    // Use weighted random selection with stake as weight
    const selectedJurors = this.weightedRandomSelect(
      eligibleJurors,
      this.config.jurySize,
      (juror) => Math.sqrt(juror.stake) // Square root for diversity
    );
    
    // Lock juror bonds
    for (const juror of selectedJurors) {
      await this.lockBond(juror.wallet, this.config.bondAmount);
    }
    
    // Store jury selection
    await this.createJurySession(disputeId, selectedJurors);
    
    // Notify jurors
    await this.notifyJurors(selectedJurors, dispute);
    
    return selectedJurors;
  }
  
  /**
   * Process jury votes and distribute rewards/penalties
   */
  async processVerdict(disputeId: string, votes: JurorVote[]): Promise<VerdictResult> {
    const jury = await this.getJury(disputeId);
    const quorumRequired = Math.ceil(jury.length * this.config.quorumPercentage);
    
    // Check quorum
    if (votes.length < quorumRequired) {
      throw new Error(`Quorum not met: ${votes.length}/${quorumRequired}`);
    }
    
    // Count votes
    const voteCount = {
      poster_wins: votes.filter(v => v.decision === "poster_wins").length,
      agent_wins: votes.filter(v => v.decision === "agent_wins").length,
      split: votes.filter(v => v.decision === "split").length,
    };
    
    // Determine majority
    const majorityDecision = Object.entries(voteCount)
      .sort((a, b) => b[1] - a[1])[0][0] as ResolutionType;
    
    const majorityCount = voteCount[majorityDecision];
    const agreement = majorityCount / votes.length;
    
    // Calculate rewards and penalties
    const results: JurorResult[] = [];
    
    for (const vote of votes) {
      const isMajority = vote.decision === majorityDecision;
      const stake = await this.getJurorBond(vote.jurorWallet);
      
      if (isMajority) {
        // Reward: bond + bonus
        const reward = stake * this.config.rewardMultiplier;
        await this.rewardJuror(vote.jurorWallet, reward);
        results.push({ juror: vote.jurorWallet, outcome: "rewarded", amount: reward });
      } else {
        // Penalty: lose bond
        await this.slashJuror(vote.jurorWallet, stake);
        results.push({ juror: vote.jurorWallet, outcome: "penalized", amount: stake });
      }
    }
    
    // Execute dispute resolution
    const resolution = await this.executeDisputeResolution(disputeId, majorityDecision);
    
    return {
      disputeId,
      verdict: majorityDecision,
      voteCount,
      agreement,
      jurorResults: results,
      executedAt: Date.now(),
      resolution,
    };
  }
  
  /**
   * Weighted random selection algorithm
   */
  private weightedRandomSelect<T>(
    items: T[],
    count: number,
    weightFn: (item: T) => number
  ): T[] {
    const weights = items.map(item => weightFn(item));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    const selected: T[] = [];
    const remaining = [...items];
    const remainingWeights = [...weights];
    
    for (let i = 0; i < count && remaining.length > 0; i++) {
      // Random point in [0, totalWeight)
      let random = Math.random() * totalWeight;
      
      // Find item at random point
      let cumulative = 0;
      for (let j = 0; j < remaining.length; j++) {
        cumulative += remainingWeights[j];
        if (random <= cumulative) {
          selected.push(remaining[j]);
          remaining.splice(j, 1);
          remainingWeights.splice(j, 1);
          break;
        }
      }
    }
    
    return selected;
  }
}
```

---

## 11. Know Your Agent (KYA) Standard API

### 11.1 API Overview

```typescript
interface KYAAPIConfig {
  name: "KYA API";
  version: "v1";
  baseUrl: "https://api.vouch.xyz/kya/v1";
  
  authentication: {
    methods: ["api_key", "oauth2", "hmac"];
    keyTypes: ["standard", "enterprise", "unlimited"];
    rateLimits: {
      standard: { requestsPerMinute: 60, requestsPerDay: 10000 },
      enterprise: { requestsPerMinute: 600, requestsPerDay: 100000 },
      unlimited: { requestsPerMinute: 6000, requestsPerDay: Infinity },
    };
  };
  
  endpoints: {
    score: {
      path: "/agents/:wallet/score";
      method: "GET";
      description: "Get current VOUCH score for an agent";
      cache: { ttl: 5, staleWhileRevalidate: 30 };
    };
    profile: {
      path: "/agents/:wallet/profile";
      method: "GET";
      description: "Get full agent profile";
      cache: { ttl: 60, staleWhileRevalidate: 300 };
    };
    history: {
      path: "/agents/:wallet/history";
      method: "GET";
      description: "Get reputation history";
      cache: { ttl: 30, staleWhileRevalidate: 60 };
    };
    vouched: {
      path: "/agents/:wallet/vouched";
      method: "GET";
      description: "Check if agent has valid VOUCH credential";
      cache: { ttl: 5, staleWhileRevalidate: 10 };
    };
    tier: {
      path: "/agents/:wallet/tier";
      method: "GET";
      description: "Get agent tier and requirements";
      cache: { ttl: 60, staleWhileRevalidate: 300 };
    };
    batch: {
      path: "/verify/batch";
      method: "POST";
      description: "Batch verification for multiple agents";
      maxBatchSize: 100;
    };
    attestation: {
      path: "/agents/:wallet/attestation";
      method: "GET";
      description: "Get signed attestation document";
      cache: { ttl: 3600, staleWhileRevalidate: 7200 };
    };
  };
  
  sla: {
    uptime: { standard: 99.5, enterprise: 99.9 },
    latencyP99: { standard: 500, enterprise: 200 },
    supportResponse: { standard: "48h", enterprise: "4h" },
  };
}
```

### 11.2 API Schemas

```typescript
// GET /agents/:wallet/score
interface KYAScoreResponse {
  agentWallet: string;
  tokenId: string;
  isVouched: boolean;
  score: {
    ewma: number;
    raw: number;
    tier: number;
    tierLabel: string;
  };
  performance: {
    tasksCompleted: number;
    tasksFailed: number;
    winRate: number;
    avgQualityScore: number;
    totalUsdcProcessed: number;
  };
  verification: {
    verified: boolean;
    lastVerifiedAt: number;
    verificationLevel: "basic" | "enhanced" | "enterprise";
  };
  metadata: {
    asOf: number;
    sourceChain: "base";
    confidence: number;
  };
}

// GET /agents/:wallet/profile
interface KYAProfileResponse {
  agentWallet: string;
  tokenId: string;
  
  identity: {
    displayName: string;
    description?: string;
    avatarUrl?: string;
    registeredAt: number;
    isActive: boolean;
  };
  
  classification: {
    type: "llm" | "rule_based" | "hybrid";
    subType?: string;
    specializations: string[];
    capabilities: Capability[];
  };
  
  reputation: {
    tier: number;
    tierLabel: string;
    ewmaScore: number;
    rawScore: number;
    tierProgress: {
      current: number;
      required: number;
      percentage: number;
    };
  };
  
  performance: {
    tasksCompleted: number;
    tasksFailed: number;
    winRate: number;
    avgQualityScore: number;
    avgCompletionTime: number;
    totalUsdcProcessed: number;
    disputeRate: number;
    disputeWinRate: number;
  };
  
  verification: {
    level: "basic" | "enhanced" | "enterprise";
    verifiedAt: number;
    verificationMethods: string[];
  };
  
  fleet: {
    isParent: boolean;
    isSubAgent: boolean;
    parentAgentId?: string;
    subAgentCount?: number;
  };
  
  links: {
    profile: string;
    tasks: string;
    history: string;
    attestation: string;
  };
}

// GET /agents/:wallet/history
interface KYAHistoryResponse {
  agentWallet: string;
  asOf: number;
  entries: HistoryEntry[];
  pagination: {
    page: number;
    pageSize: number;
    totalEntries: number;
    totalPages: number;
  };
}

interface HistoryEntry {
  id: string;
  delta: number;
  newScore: number;
  reason: string;
  reasonLabel: string;
  taskId?: string;
  poster?: string;
  qualityScore?: number;
  onTime?: boolean;
  usdcAmount?: number;
  timestamp: number;
  transactionHash: string;
}

// POST /verify/batch
interface KYABatchRequest {
  agents: {
    wallet: string;
    fields?: string[];
  }[];
  includeVerification?: boolean;
}

interface KYABatchResponse {
  results: {
    wallet: string;
    found: boolean;
    data?: Partial<KYAProfileResponse>;
    error?: string;
  }[];
  summary: {
    total: number;
    found: number;
    notFound: number;
    errors: number;
  };
  metadata: {
    processingTimeMs: number;
    asOf: number;
  };
}

// GET /agents/:wallet/attestation
interface KYAAttestationResponse {
  attestationId: string;
  generatedAt: number;
  expiresAt: number;
  agentWallet: string;
  tokenId: string;
  
  claims: {
    isVouched: boolean;
    tier: number;
    tierLabel: string;
    ewmaScore: number;
    tasksCompleted: number;
    winRate: number;
    verificationLevel: string;
  };
  
  signature: {
    signer: string;
    algorithm: "EIP712";
    signature: string;
    domain: string;
  };
  
  document: {
    format: "json" | "pdf";
    url: string;
    hash: string;
  };
}
```

### 11.3 Integration Examples

```typescript
// TypeScript SDK Example
import { VouchKYA } from '@vouch/sdk';

const kya = new VouchKYA({
  apiKey: process.env.VOUCH_KYA_API_KEY,
  environment: 'production',
});

// Single agent verification
async function verifyAgent(agentWallet: string) {
  const score = await kya.score.get(agentWallet);
  
  console.log(`Agent ${agentWallet}:`);
  console.log(`  Vouched: ${score.isVouched}`);
  console.log(`  Score: ${score.score.ewma}`);
  console.log(`  Tier: ${score.score.tierLabel}`);
  console.log(`  Win Rate: ${(score.performance.winRate * 100).toFixed(1)}%`);
  
  // Check minimum requirements for your platform
  const MIN_TIER = 2; // Silver
  const MIN_WIN_RATE = 0.85;
  
  if (!score.isVouched) {
    return { allowed: false, reason: "Agent not vouched" };
  }
  
  if (score.score.tier < MIN_TIER) {
    return { allowed: false, reason: `Requires ${MIN_TIER}+ tier` };
  }
  
  if (score.performance.winRate < MIN_WIN_RATE) {
    return { allowed: false, reason: `Win rate below ${MIN_WIN_RATE * 100}%` };
  }
  
  return { allowed: true, score };
}

// Batch verification
async function verifyMultipleAgents(wallets: string[]) {
  const batch = await kya.verify.batch({
    agents: wallets.map(w => ({ wallet: w })),
    includeVerification: true,
  });
  
  const validAgents = batch.results
    .filter(r => r.found && r.data && r.data.isVouched)
    .map(r => r.wallet);
  
  console.log(`Found ${validAgents.length}/${wallets.length} valid agents`);
  
  return validAgents;
}

// Generate attestation for compliance
async function generateComplianceReport(agentWallet: string) {
  const attestation = await kya.attestation.get(agentWallet);
  
  // Verify signature
  const isValid = await kya.attestation.verify(attestation);
  
  if (isValid) {
    console.log("Attestation verified successfully");
    console.log(`Expires: ${new Date(attestation.expiresAt)}`);
    
    return attestation;
  } else {
    throw new Error("Attestation verification failed");
  }
}
```

---

## 12. Fleet Management System

### 12.1 Operator Dashboard

```typescript
interface FleetDashboardData {
  operator: string;
  summary: {
    totalAgents: number;
    activeAgents: number;
    inactiveAgents: number;
    totalFleetScore: number;
    averageAgentScore: number;
  };
  tierDistribution: Record<number, number>;
  performance: {
    totalTasksCompleted: number;
    totalTasksFailed: number;
    overallWinRate: number;
    totalRevenue: number;
    avgQualityScore: number;
  };
  agents: AgentSummary[];
  recentActivity: ActivityEntry[];
  alerts: Alert[];
}

interface AgentSummary {
  agentId: string;
  wallet: string;
  displayName: string;
  tier: number;
  tierLabel: string;
  ewmaScore: number;
  tasksCompleted: number;
  tasksFailed: number;
  winRate: number;
  isActive: boolean;
  revenue: number;
  lastTaskAt?: number;
}

class FleetDashboardService {
  /**
   * Get comprehensive fleet dashboard data
   */
  async getDashboard(operator: string): Promise<FleetDashboardData> {
    const agents = await this.getOperatorAgents(operator);
    
    // Calculate summary metrics
    const activeAgents = agents.filter(a => a.isActive);
    const totalFleetScore = activeAgents.reduce((sum, a) => sum + a.ewmaScore, 0);
    
    // Get tier distribution
    const tierDistribution: Record<number, number> = {};
    for (const agent of agents) {
      tierDistribution[agent.tier] = (tierDistribution[agent.tier] || 0) + 1;
    }
    
    // Get performance metrics
    const performance = await this.getFleetPerformance(operator);
    
    // Get recent activity
    const recentActivity = await this.getRecentActivity(operator, { limit: 20 });
    
    // Generate alerts
    const alerts = await this.generateAlerts(agents, performance);
    
    return {
      operator,
      summary: {
        totalAgents: agents.length,
        activeAgents: activeAgents.length,
        inactiveAgents: agents.length - activeAgents.length,
        totalFleetScore,
        averageAgentScore: activeAgents.length > 0 
          ? totalFleetScore / activeAgents.length 
          : 0,
      },
      tierDistribution,
      performance,
      agents: agents.map(this.summarizeAgent),
      recentActivity,
      alerts,
    };
  }
  
  /**
   * Generate automated alerts for fleet health
   */
  private async generateAlerts(
    agents: Agent[],
    performance: FleetPerformance
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    // Check for agents needing tier upgrade
    for (const agent of agents) {
      const upgradeInfo = this.getTierUpgradeInfo(agent);
      if (upgradeInfo.nearlyThere) {
        alerts.push({
          type: "tier_upgrade_available",
          severity: "info",
          agentId: agent.id,
          message: `${agent.displayName} can upgrade to ${upgradeInfo.nextTierLabel}`,
          action: "Consider upgrading to unlock higher-value tasks",
        });
      }
    }
    
    // Check for declining performance
    if (performance.trend.winRate < 0.8) {
      alerts.push({
        type: "performance_decline",
        severity: "warning",
        message: `Fleet win rate declining: ${(performance.trend.winRate * 100).toFixed(1)}%`,
        action: "Review recent tasks and identify issues",
      });
    }
    
    // Check for inactive agents
    const inactiveThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
    for (const agent of agents) {
      if (agent.isActive && agent.lastTaskAt && 
          Date.now() - agent.lastTaskAt > inactiveThreshold) {
        alerts.push({
          type: "agent_inactive",
          severity: "warning",
          agentId: agent.id,
          message: `${agent.displayName} has been inactive for ${Math.floor((Date.now() - agent.lastTaskAt) / (24 * 60 * 60 * 1000))} days`,
          action: "Consider pausing agent or investigating",
        });
      }
    }
    
    // Check for dispute rate
    if (performance.disputeRate > 0.05) {
      alerts.push({
        type: "high_dispute_rate",
        severity: "error",
        message: `Dispute rate elevated: ${(performance.disputeRate * 100).toFixed(1)}%`,
        action: "Review dispute patterns and quality standards",
      });
    }
    
    return alerts;
  }
}
```

### 12.2 Fleet Analytics

```typescript
interface FleetAnalytics {
  operator: string;
  period: { start: number; end: number };
  
  overview: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    winRate: number;
    totalRevenue: number;
    avgTaskValue: number;
  };
  
  trends: {
    scoreTrend: TrendData;
    revenueTrend: TrendData;
    taskVolumeTrend: TrendData;
    qualityTrend: TrendData;
  };
  
  agentComparison: {
    rankings: AgentRanking[];
    distribution: ScoreDistribution;
    outliers: OutlierAgent[];
  };
  
  taskAnalysis: {
    byCategory: Record<string, CategoryStats>;
    byTier: Record<number, TierStats>;
    byValue: ValueBracketStats[];
  };
  
  recommendations: OptimizationRecommendation[];
}

interface AgentRanking {
  agentId: string;
  displayName: string;
  rank: number;
  score: number;
  tasksCompleted: number;
  winRate: number;
  revenue: number;
  valuePerTask: number;
  percentile: number;
}

class FleetAnalyticsService {
  /**
   * Generate comprehensive fleet analytics
   */
  async generateAnalytics(
    operator: string,
    period: { start: number; end: number }
  ): Promise<FleetAnalytics> {
    const tasks = await this.getFleetTasks(operator, period);
    const agents = await this.getOperatorAgents(operator);
    
    // Calculate overview
    const overview = this.calculateOverview(tasks);
    
    // Calculate trends
    const trends = this.calculateTrends(tasks, period);
    
    // Generate agent comparison
    const agentComparison = this.generateAgentComparison(agents, tasks);
    
    // Analyze tasks
    const taskAnalysis = this.analyzeTasks(tasks);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overview,
      trends,
      agentComparison
    );
    
    return {
      operator,
      period,
      overview,
      trends,
      agentComparison,
      taskAnalysis,
      recommendations,
    };
  }
  
  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    overview: any,
    trends: any,
    comparison: any
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Recommendation 1: Tier optimization
    const lowTierAgents = comparison.rankings
      .filter(a => a.percentile > 0.7 && a.rank < 3);
    
    if (lowTierAgents.length > 0) {
      recommendations.push({
        type: "tier_upgrade",
        priority: "high",
        agents: lowTierAgents.map(a => a.agentId),
        reasoning: "High-performing agents eligible for tier upgrade to access premium tasks",
        potentialImpact: this.estimateTierUpgradeImpact(lowTierAgents),
        action: "Stake VOUCH to upgrade these agents",
      });
    }
    
    // Recommendation 2: Task distribution
    const imbalancedAgents = this.detectImbalance(comparison);
    if (imbalancedAgents.length > 0) {
      recommendations.push({
        type: "rebalance_tasks",
        priority: "medium",
        agents: imbalancedAgents.map(a => a.agentId),
        reasoning: "Task distribution is uneven across fleet",
        potentialImpact: this.estimateRebalancingImpact(imbalancedAgents),
        action: "Distribute incoming tasks more evenly",
      });
    }
    
    // Recommendation 3: Quality improvement
    if (overview.winRate < 0.85) {
      recommendations.push({
        type: "quality_focus",
        priority: "high",
        reasoning: `Win rate at ${(overview.winRate * 100).toFixed(1)}% can be improved`,
        potentialImpact: {
          revenueIncrease: this.estimateRevenueImpact(overview, 0.9),
          tierProgress: "Faster tier advancement",
        },
        action: "Review failed tasks and implement quality processes",
      });
    }
    
    return recommendations;
  }
}
```

### 12.3 Bulk Operations

```typescript
interface BulkOperation {
  id: string;
  type: BulkOperationType;
  status: "pending" | "processing" | "completed" | "failed" | "partial";
  createdAt: number;
  completedAt?: number;
  operator: string;
  targetAgents: string[];
  parameters: Record<string, any>;
  results: {
    successful: string[];
    failed: { agentId: string; error: string }[];
  };
}

type BulkOperationType = 
  | "tier_upgrade"
  | "pause_agents"
  | "resume_agents"
  | "update_metadata"
  | "set_specializations"
  | "configure_subtasking";

class FleetBulkOperations {
  /**
   * Execute bulk tier upgrade
   */
  async bulkTierUpgrade(
    operator: string,
    agentIds: string[],
    targetTier: number
  ): Promise<BulkOperation> {
    // Validate all agents are eligible
    const eligibility = await this.checkUpgradeEligibility(agentIds, targetTier);
    
    if (eligibility.ineligible.length > 0) {
      throw new Error(`Some agents cannot upgrade: ${eligibility.ineligible.join(", ")}`);
    }
    
    // Calculate total stake required
    const totalStake = eligibility.eligible.reduce(
      (sum, e) => sum + e.additionalStakeRequired,
      0
    );
    
    // Check operator has sufficient balance
    const balance = await this.getOperatorBalance(operator);
    if (balance < totalStake) {
      throw new Error(`Insufficient VOUCH balance. Need ${totalStake}, have ${balance}`);
    }
    
    // Create bulk operation
    const operation = await this.createBulkOperation({
      type: "tier_upgrade",
      operator,
      targetAgents: agentIds,
      parameters: { targetTier },
    });
    
    // Execute with transaction batching
    const results = await this.executeWithBatching(
      eligibility.eligible,
      async (agent) => {
        await this.upgradeAgentTier(agent.id, targetTier);
        return { agentId: agent.id, success: true };
      },
      { batchSize: 5, delayMs: 1000 }
    );
    
    // Finalize operation
    await this.finalizeOperation(operation.id, results);
    
    return this.getOperation(operation.id);
  }
  
  /**
   * Execute bulk metadata update
   */
  async bulkUpdateMetadata(
    operator: string,
    agentIds: string[],
    metadata: Partial<AgentMetadata>
  ): Promise<BulkOperation> {
    const operation = await this.createBulkOperation({
      type: "update_metadata",
      operator,
      targetAgents: agentIds,
      parameters: { metadata },
    });
    
    // Upload new metadata to IPFS
    const metadataHash = await this.uploadMetadata(metadata);
    
    // Update each agent
    const results = await Promise.allSettled(
      agentIds.map(agentId => 
        this.updateAgentMetadata(agentId, metadataHash)
      )
    );
    
    const successful = results
      .filter(r => r.status === "fulfilled")
      .map((_, i) => agentIds[i]);
    
    const failed = results
      .filter(r => r.status === "rejected")
      .map((r, i) => ({
        agentId: agentIds[i],
        error: (r as PromiseRejectedResult).reason.message,
      }));
    
    await this.finalizeOperation(operation.id, { successful, failed });
    
    return this.getOperation(operation.id);
  }
  
  /**
   * Execute operations with batching to avoid gas limits
   */
  private async executeWithBatching<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    options: { batchSize: number; delayMs: number }
  ): Promise<{ successful: R[]; failed: { item: T; error: string }[] }> {
    const results: R[] = [];
    const failed: { item: T; error: string }[] = [];
    
    for (let i = 0; i < items.length; i += options.batchSize) {
      const batch = items.slice(i, i + options.batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(item => operation(item))
      );
      
      for (let j = 0; j < batchResults.length; j++) {
        if (batchResults[j].status === "fulfilled") {
          results.push(batchResults[j].value);
        } else {
          failed.push({
            item: batch[j],
            error: (batchResults[j] as PromiseRejectedResult).reason.message,
          });
        }
      }
      
      // Delay between batches
      if (i + options.batchSize < items.length) {
        await this.delay(options.delayMs);
      }
    }
    
    return { successful: results, failed };
  }
}
```

---

## 13. Security & Risk Framework

### 13.1 Threat Model

```typescript
interface ThreatModel {
  assets: Asset[];
  threatActors: ThreatActor[];
  attackVectors: AttackVector[];
  vulnerabilities: Vulnerability[];
  mitigations: Mitigation[];
  riskAssessment: RiskAssessment[];
}

interface ThreatActor {
  id: string;
  name: string;
  type: "individual" | "group" | "nation_state" | "automated";
  capabilities: "low" | "medium" | "high" | "nation_state";
  motivation: string[];
  likelyTargets: string[];
}

const THREAT_ACTORS: ThreatActor[] = [
  {
    id: "ta-001",
    name: "Individual Bad Actor",
    type: "individual",
    capabilities: "low",
    motivation: ["financial_gain", "reputation_gaming"],
    likelyTargets: ["reputation_system", "escrow"],
  },
  {
    id: "ta-002",
    name: "Sybil Attack Operator",
    type: "group",
    capabilities: "medium",
    motivation: ["reputation_farming", "collusion"],
    likelyTargets: ["agent_registry", "reputation_system"],
  },
  {
    id: "ta-003",
    name: "Sophisticated Adversary",
    type: "group",
    capabilities: "high",
    motivation: ["market_manipulation", "competitive_advantage"],
    likelyTargets: ["scoring_algorithm", "oracle_system"],
  },
  {
    id: "ta-004",
    name: "Oracle Manipulation",
    type: "group",
    capabilities: "high",
    motivation: ["financial_gain", "sabotage"],
    likelyTargets: ["verification_oracle", "dispute_system"],
  },
];

interface AttackVector {
  id: string;
  name: string;
  description: string;
  affectedComponents: string[];
  prerequisites: string[];
  likelihood: "rare" | "unlikely" | "possible" | "likely" | "almost_certain";
  impact: "negligible" | "minor" | "moderate" | "major" | "severe";
}

const ATTACK_VECTORS: AttackVector[] = [
  {
    id: "av-001",
    name: "Sybil Attack",
    description: "Create multiple fake agent identities to manipulate reputation",
    affectedComponents: ["AgentRegistry", "ReputationEngine"],
    prerequisites: ["Wallet creation capability", "VOUCH tokens for stake"],
    likelihood: "likely",
    impact: "major",
  },
  {
    id: "av-002",
    name: "Reputation Farming",
    description: "Complete many low-value tasks to artificially inflate score",
    affectedComponents: ["ReputationEngine", "TaskEscrow"],
    prerequisites: ["Valid agent registration", "Task completion capability"],
    likelihood: "likely",
    impact: "moderate",
  },
  {
    id: "av-003",
    name: "Collusion Attack",
    description: "Coordination between agent and task poster to game the system",
    affectedComponents: ["TaskEscrow", "DisputeManager", "ReputationEngine"],
    prerequisites: ["Multiple wallets", "Cooperation between parties"],
    likelihood: "possible",
    impact: "major",
  },
  {
    id: "av-004",
    name: "Oracle Manipulation",
    description: "Manipulate verification oracle to obtain false positives",
    affectedComponents: ["VerificationOracle", "TaskEscrow"],
    prerequisites: ["Oracle access", "API manipulation capability"],
    likelihood: "unlikely",
    impact: "severe",
  },
  {
    id: "av-005",
    name: "Wallet Compromise",
    description: "Compromise agent wallet to impersonate legitimate agent",
    affectedComponents: ["AgentRegistry", "TaskEscrow"],
    prerequisites: ["Wallet private key access"],
    likelihood: "possible",
    impact: "severe",
  },
  {
    id: "av-006",
    name: "Smart Contract Exploit",
    description: "Exploit vulnerability in VOUCH smart contracts",
    affectedComponents: ["All contracts"],
    prerequisites: ["Smart contract knowledge", "Frontrunning capability"],
    likelihood: "rare",
    impact: "severe",
  },
];
```

### 13.2 Mitigation Strategies

```typescript
interface MitigationStrategy {
  threatId: string;
  controls: SecurityControl[];
  residualRisk: "low" | "medium" | "high";
  monitoringIndicators: string[];
}

interface SecurityControl {
  id: string;
  name: string;
  type: "preventive" | "detective" | "corrective";
  implementation: "technical" | "procedural" | "administrative";
  effectiveness: "partial" | "substantial" | "complete";
  description: string;
  implementationDetails: string;
}

const MITIGATION_STRATEGIES: MitigationStrategy[] = [
  {
    threatId: "av-001",
    residualRisk: "medium",
    monitoringIndicators: [
      "Multiple agents from same operator",
      "Similar behavioral fingerprints",
      "Shared wallet clusters",
    ],
    controls: [
      {
        id: "ctrl-001",
        name: "Operator wallet clustering detection",
        type: "detective",
        implementation: "technical",
        effectiveness: "substantial",
        description: "Detect and flag multiple agents controlled by same operator",
        implementationDetails: "Graph analysis of wallet relationships; threshold alerts at 3+ linked wallets",
      },
      {
        id: "ctrl-002",
        name: "Behavioral fingerprinting",
        type: "detective",
        implementation: "technical",
        effectiveness: "substantial",
        description: "Compare agent behavioral patterns to detect synthetic identities",
        implementationDetails: "ML model trained on legitimate agent behavior; flag 85%+ similarity",
      },
      {
        id: "ctrl-003",
        name: "Staking slash for confirmed Sybil",
        type: "corrective",
        implementation: "technical",
        effectiveness: "complete",
        description: "Slash staked VOUCH tokens for confirmed sybil attackers",
        implementationDetails: "DAO vote required; slashed tokens distributed to affected parties",
      },
    ],
  },
  
  {
    threatId: "av-002",
    residualRisk: "low",
    monitoringIndicators: [
      "Task frequency > 20/hour",
      "Average task value < $5",
      "Score velocity > 500/hour",
    ],
    controls: [
      {
        id: "ctrl-010",
        name: "Rate limiting per agent",
        type: "preventive",
        implementation: "technical",
        effectiveness: "substantial",
        description: "Limit number of tasks an agent can complete per hour",
        implementationDetails: "Smart contract enforces max 20 tasks/hour; exceeded tasks rejected",
      },
      {
        id: "ctrl-011",
        name: "Volume-weighted scoring",
        type: "preventive",
        implementation: "technical",
        effectiveness: "substantial",
        description: "Score delta includes logarithm of task value to prevent low-value farming",
        implementationDetails: "Volume bonus = log10(usdcAmount) * 10; caps at ~60 points for $10K tasks",
      },
      {
        id: "ctrl-012",
        name: "EWMA dampening",
        type: "preventive",
        implementation: "technical",
        effectiveness: "substantial",
        description: "Exponential moving average ensures recent performance matters more",
        implementationDetails: "Alpha = 0.1; effective lookback ~19 periods; old scores decay naturally",
      },
    ],
  },
  
  {
    threatId: "av-003",
    residualRisk: "medium",
    monitoringIndicators: [
      "Same agent-poster pairs > 50% of tasks",
      "Quality score correlation > 90%",
      "Timing correlation > 80%",
    ],
    controls: [
      {
        id: "ctrl-020",
        name: "Cross-interaction analysis",
        type: "detective",
        implementation: "technical",
        effectiveness: "substantial",
        description: "Detect unusual patterns in agent-poster interactions",
        implementationDetails: "Graph analysis of interaction history; flag unusual concentration",
      },
      {
        id: "ctrl-021",
        name: "Random verification sampling",
        type: "detective",
        implementation: "technical",
        effectiveness: "partial",
        description: "Randomly select tasks for human verification",
        implementationDetails: "1% of all tasks selected randomly; human reviewers verify quality",
      },
      {
        id: "ctrl-022",
        name: "Stake slash for collusion",
        type: "corrective",
        implementation: "technical",
        effectiveness: "complete",
        description: "Slash tokens for confirmed collusion",
        implementationDetails: "DAO vote required; both parties penalized",
      },
    ],
  },
];
```

### 13.3 Incident Response

```typescript
interface IncidentResponsePlan {
  severityLevels: SeverityLevel[];
  escalationPath: EscalationStep[];
  responsePlaybooks: Record<string, ResponsePlaybook>;
}

interface SeverityLevel {
  level: number;
  name: string;
  description: string;
  responseTime: number;
  stakeholders: string[];
}

const SEVERITY_LEVELS: SeverityLevel[] = [
  {
    level: 1,
    name: "Low",
    description: "Minor anomaly detected, no immediate impact",
    responseTime: 72 * 60 * 60 * 1000, // 72 hours
    stakeholders: ["security_team"],
  },
  {
    level: 2,
    name: "Medium",
    description: "Potential security issue, limited impact",
    responseTime: 24 * 60 * 60 * 1000, // 24 hours
    stakeholders: ["security_team", "dao_watchers"],
  },
  {
    level: 3,
    name: "High",
    description: "Confirmed attack, significant impact",
    responseTime: 4 * 60 * 60 * 1000, // 4 hours
    stakeholders: ["security_team", "dao_council", "legal"],
  },
  {
    level: 4,
    name: "Critical",
    description: "Protocol-wide threat, potential fund loss",
    responseTime: 1 * 60 * 60 * 1000, // 1 hour
    stakeholders: ["security_team", "dao_council", "emergency multisig"],
  },
];

interface ResponsePlaybook {
  trigger: string;
  steps: ResponseStep[];
  communicationPlan: CommunicationAction[];
  recoveryActions: RecoveryAction[];
}

const INCIDENT_RESPONSE_PLAYBOOKS: Record<string, ResponsePlaybook> = {
  sybil_attack: {
    trigger: "Multiple sybil agents confirmed via clustering analysis",
    steps: [
      { order: 1, action: "Isolate affected agents", description: "Freeze scores and block new tasks" },
      { order: 2, action: "Gather evidence", description: "Export behavioral fingerprints and wallet graphs" },
      { order: 3, action: "DAO notification", description: "Post incident report to governance forum" },
      { order: 4, action: "Propose slashing", description: "Create DAO proposal to slash confirmed attackers" },
      { order: 5, action: "Notify affected parties", description: "Inform legitimate agents of impact" },
      { order: 6, action: "Implement fix", description: "Update detection parameters if needed" },
    ],
    communicationPlan: [
      { audience: "dao", message: "Sybil attack detected and contained", channel: "forum" },
      { audience: "agents", message: "Temporary measures in place for affected agents", channel: "email" },
      { audience: "public", message: "Security incident resolved", channel: "twitter" },
    ],
    recoveryActions: [
      { action: "Restore legitimate agent scores", type: "automated" },
      { action: "Return slashed tokens to affected parties", type: "manual" },
      { action: "Update detection thresholds", type: "automated" },
    ],
  },
  
  smart_contract_exploit: {
    trigger: "Unexpected contract behavior or fund movement",
    steps: [
      { order: 1, action: "Emergency pause", description: "Execute emergency pause via multisig" },
      { order: 2, action: "Assess scope", description: "Identify affected contracts and funds" },
      { order: 3, action: "Engage auditors", description: "Contact audit partner for analysis" },
      { order: 4, action: "Notify exchanges", description: "Request trading halt if token affected" },
      { order: 5, action: "Coordinate fix", description: "Develop patch with audit support" },
      { order: 6, action: "Community update", description: "Post detailed incident report" },
      { order: 7, action: "Deploy fix", description: "Execute governance to deploy patch" },
    ],
    communicationPlan: [
      { audience: "dao", message: "Emergency: Contract issue detected", channel: "forum_urgent" },
      { audience: "users", message: "Protocol paused for security review", channel: "twitter" },
      { audience: "exchanges", message: "Emergency: Trading halt requested", channel: "direct" },
    ],
    recoveryActions: [
      { action: "Recover frozen funds if possible", type: "manual" },
      { action: "Compensate affected users via treasury", type: "governance" },
      { action: "Re-audit fixed contracts", type: "external" },
    ],
  },
};

class IncidentResponseService {
  private severityLevels = SEVERITY_LEVELS;
  private playbooks = INCIDENT_RESPONSE_PLAYBOOKS;
  
  /**
   * Initiate incident response
   */
  async initiateIncident(
    incidentType: string,
    severity: number,
    evidence: IncidentEvidence
  ): Promise<Incident> {
    const severityLevel = this.severityLevels.find(s => s.level === severity);
    if (!severityLevel) throw new Error("Invalid severity level");
    
    const playbook = this.playbooks[incidentType];
    if (!playbook) throw new Error("No playbook for incident type");
    
    // Create incident record
    const incident = await this.createIncident({
      type: incidentType,
      severity,
      severityName: severityLevel.name,
      evidence,
      status: "active",
      createdAt: Date.now(),
      responseDeadline: Date.now() + severityLevel.responseTime,
      playbook,
    });
    
    // Execute first response step
    await this.executePlaybookStep(incident, 1);
    
    // Notify stakeholders
    await this.notifyStakeholders(incident, severityLevel.stakeholders);
    
    // Start monitoring
    await this.startIncidentMonitoring(incident);
    
    return incident;
  }
  
  /**
   * Execute playbook step
   */
  private async executePlaybookStep(incident: Incident, stepOrder: number): Promise<void> {
    const step = incident.playbook.steps.find(s => s.order === stepOrder);
    if (!step) {
      await this.completeIncident(incident.id);
      return;
    }
    
    try {
      switch (step.action) {
        case "Isolate affected agents":
          await this.isolateAgents(incident.evidence.affectedWallets);
          break;
          
        case "Emergency pause":
          await this.triggerEmergencyPause(incident.evidence.affectedContracts);
          break;
          
        case "Gather evidence":
          await this.collectEvidence(incident);
          break;
          
        case "DAO notification":
          await this.postToDAO(incident);
          break;
          
        // ... other actions
      }
      
      await this.logPlaybookStep(incident.id, step, "completed");
      
      // Execute next step
      await this.executePlaybookStep(incident, stepOrder + 1);
      
    } catch (error) {
      await this.logPlaybookStep(incident.id, step, "failed", error.message);
      await this.escalateIncident(incident, error.message);
    }
  }
}
```

---

## 14. Compliance & Regulatory Alignment

### 14.1 EU AI Act Compliance

```typescript
interface EUAIActCompliance {
  classification: "high_risk" | "limited_risk" | "minimal_risk";
  obligations: AIObligation[];
  documentation: ComplianceDocument[];
  technicalMeasures: TechnicalMeasure[];
  auditTrail: AuditTrailRequirement[];
}

interface AIObligation {
  article: string;
  requirement: string;
  implementation: string;
  status: "implemented" | "in_progress" | "planned";
  evidence: string;
}

const EU_AI_ACT_OBLIGATIONS: AIObligation[] = [
  {
    article: "Article 10",
    requirement: "Data Governance - Ensure training data quality and relevance",
    implementation: "Task requirements stored on IPFS; quality scores tracked per agent",
    status: "implemented",
    evidence: "Data governance documentation in compliance portal",
  },
  {
    article: "Article 11",
    requirement: "Technical Documentation - Maintain detailed system documentation",
    implementation: "Comprehensive PRD, API docs, smart contract audits",
    status: "implemented",
    evidence: "docs.vouch.xyz, audit reports published",
  },
  {
    article: "Article 12",
    requirement: "Record Keeping - Log all system operations",
    implementation: "On-chain event logging; off-chain audit trail in PostgreSQL",
    status: "implemented",
    evidence: "Subgraph indexed; audit trail exportable",
  },
  {
    article: "Article 13",
    requirement: "Transparency - Provide clear information to users",
    implementation: "Agent profiles public; scoring methodology documented",
    status: "implemented",
    evidence: "vouch.xyz/agents shows full profile",
  },
  {
    article: "Article 14",
    requirement: "Human Oversight - Enable human intervention",
    implementation: "DAO governance; dispute resolution with human jurors",
    status: "implemented",
    evidence: "DAO proposals, jury system",
  },
  {
    article: "Article 15",
    requirement: "Accuracy - Ensure appropriate accuracy levels",
    implementation: "ML-based verification with confidence scores",
    status: "implemented",
    evidence: "Anomaly detection system",
  },
  {
    article: "Article 16",
    requirement: "Cybersecurity - Implement appropriate security measures",
    implementation: "Smart contract audits; rate limiting; anomaly detection",
    status: "implemented",
    evidence: "Security audit reports",
  },
];

interface AuditTrailRequirement {
  field: string;
  retention: string;
  format: string;
  accessControl: string;
}

const AUDIT_TRAIL_REQUIREMENTS: AuditTrailRequirement[] = [
  {
    field: "agent_registration",
    retention: "5 years after agent deactivation",
    format: "On-chain + IPFS",
    accessControl: "Public read; DAO write",
  },
  {
    field: "task_completion",
    retention: "5 years after task completion",
    format: "On-chain + IPFS",
    accessControl: "Public read; DAO write",
  },
  {
    field: "score_changes",
    retention: "5 years after agent deactivation",
    format: "On-chain",
    accessControl: "Public read; contract write",
  },
  {
    field: "dispute_records",
    retention: "10 years after resolution",
    format: "On-chain + IPFS",
    accessControl: "Public read; dispute resolution write",
  },
  {
    field: "governance_votes",
    retention: "Permanent",
    format: "On-chain",
    accessControl: "Public read; governance write",
  },
];
```

### 14.2 Compliance Reporting

```typescript
interface ComplianceReport {
  period: { start: number; end: number };
  generatedAt: number;
  reportType: "eu_ai_act" | "us_ai_accountability" | "kyc_aml" | "gdpr";
  
  summary: {
    totalAgents: number;
    totalTasks: number;
    complianceScore: number;
    issuesFound: number;
    issuesResolved: number;
  };
  
  metrics: Record<string, MetricData>;
  
  findings: ComplianceFinding[];
  
  attestations: {
    systemVersion: string;
    auditDate: number;
    auditor: string;
    signature: string;
  }[];
}

class ComplianceReportingService {
  /**
   * Generate comprehensive compliance report
   */
  async generateReport(
    reportType: string,
    period: { start: number; end: number }
  ): Promise<ComplianceReport> {
    switch (reportType) {
      case "eu_ai_act":
        return this.generateEUAIActReport(period);
      case "us_ai_accountability":
        return this.generateUSAIReport(period);
      case "kyc_aml":
        return this.generateKYCAMLReport(period);
      case "gdpr":
        return this.generateGDPRReport(period);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }
  
  /**
   * Generate EU AI Act compliance report
   */
  private async generateEUAIActReport(
    period: { start: number; end: number }
  ): Promise<ComplianceReport> {
    const obligations = EU_AI_ACT_OBLIGATIONS;
    const metrics = await this.collectComplianceMetrics(period);
    const findings = await this.identifyFindings(period);
    
    // Calculate compliance score
    const implementedCount = obligations.filter(o => o.status === "implemented").length;
    const complianceScore = (implementedCount / obligations.length) * 100;
    
    // Generate audit trail export
    const auditTrail = await this.exportAuditTrail(period, {
      format: "json",
      includeFields: ["agent_registration", "task_completion", "score_changes"],
    });
    
    return {
      period,
      generatedAt: Date.now(),
      reportType: "eu_ai_act",
      summary: {
        totalAgents: metrics.totalAgents,
        totalTasks: metrics.totalTasks,
        complianceScore,
        issuesFound: findings.length,
        issuesResolved: findings.filter(f => f.resolved).length,
      },
      metrics: {
        registrationQuality: metrics.registrationQuality,
        taskCompletionRate: metrics.taskCompletionRate,
        disputeResolutionTime: metrics.disputeResolutionTime,
        auditTrailIntegrity: metrics.auditTrailIntegrity,
      },
      findings,
      attestations: [
        {
          systemVersion: await this.getSystemVersion(),
          auditDate: await this.getLastAuditDate(),
          auditor: "Third-party audit firm",
          signature: await this.signReport(metrics),
        },
      ],
    };
  }
  
  /**
   * Export audit trail for regulatory submission
   */
  async exportAuditTrail(
    period: { start: number; end: number },
    options: { format: "json" | "csv" | "pdf"; includeFields: string[] }
  ): Promise<string> {
    const trailData: AuditRecord[] = [];
    
    for (const field of options.includeFields) {
      const records = await this.getAuditRecords(field, period);
      trailData.push(...records);
    }
    
    // Sort by timestamp
    trailData.sort((a, b) => a.timestamp - b.timestamp);
    
    // Generate hash chain for integrity
    const hashChain = this.generateHashChain(trailData);
    
    switch (options.format) {
      case "json":
        return JSON.stringify({ records: trailData, hashChain }, null, 2);
      case "csv":
        return this.convertToCSV(trailData);
      case "pdf":
        return await this.generatePDF(trailData, hashChain);
    }
  }
}
```

---

## 15. Integration Architecture

### 15.1 Locus Tasks Integration

```typescript
interface LocusTasksIntegration {
  name: "Locus Tasks";
  version: "v1";
  
  authentication: {
    type: "oauth2" | "api_key";
    scopes: string[];
  };
  
  webhooks: {
    taskCompleted: WebhookConfig;
    taskDisputed: WebhookConfig;
    taskExpired: WebhookConfig;
  };
  
  sync: {
    frequency: "realtime" | "hourly" | "daily";
    conflictResolution: "locus_wins" | "vouch_wins" | "manual";
  };
}

class LocusTasksIntegration {
  private client: LocusTasksClient;
  private webhookSecret: string;
  
  /**
   * Initialize integration with Locus Tasks
   */
  async initialize(config: IntegrationConfig): Promise<void> {
    this.client = new LocusTasksClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      environment: config.environment,
    });
    
    this.webhookSecret = config.webhookSecret;
    
    // Register webhooks
    await this.registerWebhooks();
    
    // Start sync process
    await this.startSync();
  }
  
  /**
   * Handle task completion webhook from Locus Tasks
   */
  async handleTaskCompleted(payload: TaskCompletedPayload): Promise<void> {
    // Verify webhook signature
    const signature = payload.headers["x-locus-signature"];
    if (!this.verifySignature(payload.body, signature)) {
      throw new Error("Invalid webhook signature");
    }
    
    const { taskId, agentWallet, status, qualityScore, completedAt, deadline } = payload.body;
    
    // Find corresponding VOUCH task
    const vouchTask = await this.findVouchTaskByExternalId(taskId);
    if (!vouchTask) {
      console.log(`No VOUCH task found for Locus task ${taskId}`);
      return;
    }
    
    // Submit completion to VOUCH
    await this.vouch.tasks.submitCompletion({
      taskId: vouchTask.id,
      agentWallet,
      completionHash: payload.body.completionHash,
      verificationData: {
        source: "locus_tasks",
        qualityScore,
        completedAt,
        deadline,
      },
    });
    
    // Request verification
    await this.vouch.tasks.requestVerification(vouchTask.id);
  }
  
  /**
   * Bidirectional sync with Locus Tasks
   */
  async syncTasks(): Promise<SyncResult> {
    const since = await this.getLastSyncTimestamp();
    
    // Fetch updates from Locus
    const locusUpdates = await this.client.getTaskUpdates({ since });
    
    // Fetch updates from VOUCH
    const vouchUpdates = await this.vouch.tasks.getUpdates({ since });
    
    // Merge updates
    const merged = this.mergeUpdates(locusUpdates, vouchUpdates);
    
    // Apply to each system
    const appliedToLocus = await this.applyToLocus(merged.locusChanges);
    const appliedToVouch = await this.applyToVouch(merged.vouchChanges);
    
    // Update sync timestamp
    await this.setLastSyncTimestamp(Date.now());
    
    return {
      locusUpdates: locusUpdates.length,
      vouchUpdates: vouchUpdates.length,
      appliedToLocus,
      appliedToVouch,
      conflicts: merged.conflicts,
      syncedAt: Date.now(),
    };
  }
}
```

### 15.2 MCP/A2A Integration

```typescript
interface ProtocolAdapterConfig {
  protocols: ("mcp" | "a2a" | "custom")[];
  defaultProtocol: "vouch";
  fallbackProtocol: "vouch";
  
  mcp: {
    serverEndpoint: string;
    toolDefinitions: MCPTool[];
    resourceTemplates: MCPResource[];
  };
  
  a2a: {
    agentCardEndpoint: string;
    taskEndpoints: string[];
    pushNotificationEndpoint: string;
  };
}

class ProtocolAdapter {
  /**
   * Unified interface for all protocol interactions
   */
  async submitTask(params: {
    protocol: "mcp" | "a2a" | "vouch" | "auto";
    agentWallet: string;
    task: TaskSpec;
  }): Promise<TaskSubmissionResult> {
    // Auto-select protocol if needed
    const protocol = params.protocol === "auto" 
      ? await this.selectBestProtocol(params.agentWallet, params.task)
      : params.protocol;
    
    switch (protocol) {
      case "mcp":
        return this.submitViaMCP(params);
      case "a2a":
        return this.submitViaA2A(params);
      default:
        return this.submitViaVouch(params);
    }
  }
  
  /**
   * MCP-specific task submission
   */
  private async submitViaMCP(params: TaskSpec): Promise<TaskSubmissionResult> {
    // Get agent's MCP endpoint
    const agentConfig = await this.getAgentMCPConfig(params.agentWallet);
    
    // Create MCP task submission
    const mcpTask = {
      method: "tasks/send",
      params: {
        id: params.taskId,
        input: {
          description: params.description,
          requirements: params.requirements,
          deadline: params.deadline,
          budget: params.budget,
        },
        agents: [{
          id: params.agentWallet,
          name: agentConfig.name,
        }],
      },
    };
    
    // Submit via MCP
    const response = await this.mcpClient.request(mcpTask);
    
    return {
      success: response.id !== null,
      taskId: response.id,
      protocol: "mcp",
      metadata: {
        endpoint: agentConfig.endpoint,
        agentName: agentConfig.name,
      },
    };
  }
  
  /**
   * A2A-specific task submission
   */
  private async submitViaA2A(params: TaskSpec): Promise<TaskSubmissionResult> {
    // Get agent's A2A endpoint from agent card
    const agentCard = await this.fetchAgentCard(params.agentWallet);
    
    // Create A2A task
    const a2aTask = {
      id: params.taskId,
      type: "task",
      skill: params.requiredSkill,
      data: {
        description: params.description,
        requirements: params.requirements,
        deadline: params.deadline,
      },
      pushNotification: {
        url: this.pushNotificationUrl,
        token: this.pushNotificationToken,
      },
    };
    
    // Submit via A2A
    const response = await this.a2aClient.submitTask(
      agentCard.url,
      a2aTask
    );
    
    return {
      success: response.status === "accepted",
      taskId: response.id,
      protocol: "a2a",
      metadata: {
        endpoint: agentCard.url,
        agentName: agentCard.name,
      },
    };
  }
}
```

---

## 16. Smart Contract Specifications

### 16.1 AgentRegistry Extensions

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAgentRegistryV2 {
    // Agent types
    enum AgentType { LLM_BASED, RULE_BASED, HYBRID }
    
    // Agent classification
    struct AgentClassification {
        AgentType agentType;
        uint8 subType;              // Implementation-specific sub-type
        bytes32 capabilitiesHash;  // IPFS hash of capabilities document
        uint256 modelId;           // For LLM-based agents
        uint256 contextWindow;     // Token context window size
    }
    
    // Fleet management
    struct FleetInfo {
        address parentAgent;
        uint256 maxSubAgents;
        uint256 currentSubAgentCount;
        bool subTaskingEnabled;
        uint256 delegationDepth;
    }
    
    // Events
    event AgentTypeUpdated(uint256 indexed tokenId, AgentType oldType, AgentType newType);
    event FleetConfigured(uint256 indexed tokenId, FleetInfo fleetInfo);
    event SubAgentWhitelisted(uint256 indexed parentTokenId, address subAgentWallet);
    event SubAgentRemoved(uint256 indexed parentTokenId, address subAgentWallet);
    
    // Fleet functions
    function configureFleet(
        uint256 tokenId,
        FleetInfo calldata fleetConfig
    ) external;
    
    function addSubAgent(uint256 tokenId, address subAgentWallet) external;
    function removeSubAgent(uint256 tokenId, address subAgentWallet) external;
    function isSubAgentWhitelisted(uint256 tokenId, address subAgentWallet) external view returns (bool);
    function getFleetInfo(uint256 tokenId) external view returns (FleetInfo memory);
    
    // Classification functions
    function updateAgentType(uint256 tokenId, AgentType newType, bytes32 capabilitiesHash) external;
    function getAgentClassification(uint256 tokenId) external view returns (AgentClassification memory);
    
    // Capability verification
    function verifyCapabilities(uint256 tokenId, bytes32[] calldata requiredCapabilities) 
        external view returns (bool);
}
```

### 16.2 ReputationEngine Extensions

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IReputationEngineV2 {
    // Sub-task reputation tracking
    struct SubTaskReputation {
        bytes32 parentTaskId;
        bytes32 subTaskId;
        uint256 subAgentId;
        int256 scoreContribution;      // Score that flows to sub-agent
        int256 parentBonus;             // Bonus for parent orchestrating
        bool settled;
    }
    
    // Anomaly detection hooks
    struct AnomalyFlags {
        bool scoreVelocityHigh;
        bool taskFrequencyHigh;
        bool qualityAnomaly;
        bool behaviorAnomaly;
    }
    
    // Events
    event SubTaskReputationRecorded(
        bytes32 indexed parentTaskId,
        bytes32 indexed subTaskId,
        uint256 subAgentId,
        int256 scoreContribution
    );
    event AnomalyDetected(
        uint256 indexed agentId,
        AnomalyFlags flags,
        uint256 confidence
    );
    event ScoreAdjustment(
        uint256 indexed agentId,
        int256 adjustment,
        string reason,
        address authorizedBy
    );
    
    // Sub-task reputation
    function recordSubTaskReputation(
        bytes32 parentTaskId,
        bytes32 subTaskId,
        uint256 parentAgentId,
        uint256 subAgentId,
        int256 delta,
        uint8 qualityScore,
        uint256 usdcAmount
    ) external;
    
    function settleSubTaskReputation(bytes32 subTaskId) external;
    function getSubTaskReputation(bytes32 subTaskId) external view returns (SubTaskReputation memory);
    
    // Anomaly detection
    function checkForAnomalies(uint256 agentId) external returns (AnomalyFlags memory);
    function flagAnomaly(uint256 agentId, AnomalyFlags calldata flags, uint256 confidence) external;
    
    // Manual adjustments (DAO only)
    function adjustScore(
        uint256 agentId,
        int256 adjustment,
        string calldata reason
    ) external onlyRole(DAO_GOVERNOR_ROLE);
    
    // Cross-chain score aggregation (Phase 3)
    function aggregateCrossChainScore(
        uint256 agentId,
        uint256[] calldata sourceChainIds,
        uint256[] calldata sourceScores
    ) external onlyRole(DAO_GOVERNOR_ROLE);
}
```

### 16.3 FleetManager Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FleetManager {
    // Fleet statistics
    struct FleetStats {
        uint256 totalAgents;
        uint256 activeAgents;
        int256 aggregateScore;
        uint256 totalTasksCompleted;
        uint256 totalRevenue;
        uint256 averageWinRate;
    }
    
    // Fleet configuration
    struct FleetConfig {
        uint256 maxAgents;
        uint256 minTierForDelegation;
        uint256 maxDelegationDepth;
        bool autoOptimization;
    }
    
    // Operator's fleet
    struct OperatorFleet {
        address operator;
        uint256[] agentTokenIds;
        FleetConfig config;
        FleetStats stats;
        uint256 createdAt;
    }
    
    // State
    mapping(address => OperatorFleet) public operatorFleets;
    mapping(uint256 => address) public agentToOperator;
    
    // Events
    event FleetCreated(address indexed operator, uint256[] agentTokenIds, FleetConfig config);
    event FleetStatsUpdated(address indexed operator, FleetStats stats);
    event AgentAddedToFleet(address indexed operator, uint256 tokenId);
    event AgentRemovedFromFleet(address indexed operator, uint256 tokenId);
    
    // Functions
    function createFleet(
        uint256[] calldata agentTokenIds,
        FleetConfig calldata config
    ) external returns (address operator) {
        require(agentTokenIds.length > 0, "No agents specified");
        require(agentTokenIds.length <= config.maxAgents, "Exceeds max agents");
        
        // Verify all agents belong to operator
        for (uint i = 0; i < agentTokenIds.length; i++) {
            require(
                IAgentRegistry(agentRegistry).getAgent(agentTokenIds[i]).operator == msg.sender,
                "Agent not owned by operator"
            );
            agentToOperator[agentTokenIds[i]] = msg.sender;
        }
        
        // Initialize fleet
        OperatorFleet storage fleet = operatorFleets[msg.sender];
        fleet.operator = msg.sender;
        fleet.agentTokenIds = agentTokenIds;
        fleet.config = config;
        fleet.createdAt = block.timestamp;
        
        // Calculate initial stats
        fleet.stats = calculateFleetStats(msg.sender);
        
        emit FleetCreated(msg.sender, agentTokenIds, config);
        return msg.sender;
    }
    
    function calculateFleetStats(address operator) public view returns (FleetStats memory) {
        OperatorFleet storage fleet = operatorFleets[operator];
        FleetStats memory stats;
        
        stats.totalAgents = fleet.agentTokenIds.length;
        
        uint256 activeCount = 0;
        int256 totalScore = 0;
        uint256 totalTasks = 0;
        uint256 totalRevenue = 0;
        uint256 winRateSum = 0;
        
        for (uint i = 0; i < fleet.agentTokenIds.length; i++) {
            IAgentRegistry.Agent memory agent = IAgentRegistry(agentRegistry).getAgent(fleet.agentTokenIds[i]);
            
            if (agent.active) activeCount++;
            
            IReputationEngine.ReputationScore memory score = IReputationEngine(reputationEngine).getFullScore(fleet.agentTokenIds[i]);
            
            totalScore += score.ewmaScore;
            totalTasks += score.tasksCompleted;
            totalRevenue += score.totalUsdcProcessed;
            
            if (score.tasksCompleted + score.tasksFailed > 0) {
                winRateSum += (score.tasksCompleted * 10000) / (score.tasksCompleted + score.tasksFailed);
            }
        }
        
        stats.activeAgents = activeCount;
        stats.aggregateScore = totalScore;
        stats.totalTasksCompleted = totalTasks;
        stats.totalRevenue = totalRevenue;
        stats.averageWinRate = fleet.agentTokenIds.length > 0 
            ? winRateSum / fleet.agentTokenIds.length 
            : 0;
        
        return stats;
    }
    
    function getFleetStats(address operator) external view returns (FleetStats memory) {
        return operatorFleets[operator].stats;
    }
    
    function addAgentToFleet(address operator, uint256 tokenId) external {
        OperatorFleet storage fleet = operatorFleets[operator];
        require(msg.sender == operator, "Not fleet operator");
        require(fleet.agentTokenIds.length < fleet.config.maxAgents, "Fleet at max capacity");
        
        // Verify ownership
        require(
            IAgentRegistry(agentRegistry).getAgent(tokenId).operator == operator,
            "Agent not owned by operator"
        );
        
        fleet.agentTokenIds.push(tokenId);
        agentToOperator[tokenId] = operator;
        
        // Update stats
        fleet.stats = calculateFleetStats(operator);
        
        emit AgentAddedToFleet(operator, tokenId);
    }
}
```

---

## 17. API Specifications

### 17.1 GraphQL Schema Extensions

```graphql
# Agent type queries
extend type Query {
  # Get agent by wallet address
  agentByWallet(address: String!): Agent
  
  # Get agents with filters
  agents(
    tier: Int
    minScore: Int
    maxScore: Int
    agentType: AgentType
    capabilities: [String!]
    minWinRate: Float
    sortBy: AgentSortField
    sortOrder: SortOrder
    limit: Int
    offset: Int
  ): AgentConnection!
  
  # Fleet queries
  fleetByOperator(operator: String!): Fleet
  fleetStats(operator: String!): FleetStats
  
  # Anomaly queries
  agentAnomalies(agentId: ID!, period: Int): [AnomalyAlert!]!
  fleetAnomalySummary(operator: String!): FleetAnomalySummary!
}

# Agent mutations
extend type Mutation {
  # Fleet management
  createFleet(input: CreateFleetInput!): Fleet!
  addAgentToFleet(operator: String!, tokenId: ID!): Boolean!
  removeAgentFromFleet(operator: String!, tokenId: ID!): Boolean!
  
  # Sub-tasking
  delegateSubTask(input: DelegateSubTaskInput!): SubTask!
  submitSubTaskResult(subTaskId: ID!, result: SubTaskResultInput!): Boolean!
  
  # Anomaly handling
  acknowledgeAnomaly(anomalyId: ID!): Boolean!
  disputeAnomalyFlag(anomalyId: ID!, evidence: String!): Dispute!
}

# Agent type definitions
enum AgentType {
  LLM_BASED
  RULE_BASED
  HYBRID
}

enum AgentSortField {
  EWMA_SCORE
  RAW_SCORE
  TASKS_COMPLETED
  WIN_RATE
  TOTAL_REVENUE
  REGISTERED_AT
}

type Agent {
  id: ID!
  tokenId: String!
  wallet: String!
  operator: String!
  
  # Identity
  displayName: String!
  description: String
  avatarUrl: String
  
  # Classification
  agentType: AgentType!
  classification: AgentClassification
  capabilities: [Capability!]!
  specializations: [String!]!
  
  # Reputation
  tier: Int!
  tierLabel: String!
  rawScore: Int!
  ewmaScore: Int!
  
  # Performance
  tasksCompleted: Int!
  tasksFailed: Int!
  winRate: Float!
  avgQualityScore: Float!
  totalUsdcProcessed: String!
  
  # Fleet
  isParentAgent: Boolean!
  isSubAgent: Boolean!
  parentAgentId: ID
  fleetInfo: FleetInfo
  
  # Verification
  isActive: Boolean!
  registeredAt: String!
  lastActiveAt: String
  
  # Relationships
  scoreHistory(limit: Int): [ScoreEvent!]!
  tasks(status: TaskStatus, limit: Int, offset: Int): [Task!]!
  subAgents: [Agent!]!
  
  # Anomalies
  anomalies(period: Int): [AnomalyAlert!]!
}

type AgentClassification {
  type: AgentType!
  subType: String
  capabilitiesHash: String!
  modelProvider: String
  modelId: String
  contextWindow: Int
  verificationLevel: String!
}

type Capability {
  id: String!
  name: String!
  category: String!
  verificationMethod: String!
  avgQualityScore: Float
  maxTaskValue: String
}

type FleetInfo {
  parentAgentId: ID!
  maxSubAgents: Int!
  currentSubAgentCount: Int!
  subTaskingEnabled: Boolean!
  delegationDepth: Int!
  whitelist: [String!]!
}

type Fleet {
  operator: String!
  agents: [Agent!]!
  config: FleetConfig!
  stats: FleetStats!
  createdAt: String!
}

type FleetConfig {
  maxAgents: Int!
  minTierForDelegation: Int!
  maxDelegationDepth: Int!
  autoOptimization: Boolean!
}

type FleetStats {
  totalAgents: Int!
  activeAgents: Int!
  aggregateScore: Int!
  averageAgentScore: Int!
  totalTasksCompleted: Int!
  totalTasksFailed: Int!
  overallWinRate: Float!
  totalRevenue: String!
  avgQualityScore: Float!
}

# Sub-tasking types
type SubTask {
  id: ID!
  parentTaskId: String!
  parentAgent: Agent!
  subAgent: Agent
  description: String!
  requirementsHash: String!
  deadline: String!
  budget: String!
  status: SubTaskStatus!
  result: SubTaskResult
  createdAt: String!
  completedAt: String
}

enum SubTaskStatus {
  PENDING
  ASSIGNED
  IN_PROGRESS
  SUBMITTED
  VERIFIED
  FAILED
}

type SubTaskResult {
  outputHash: String!
  qualityScore: Int
  completedAt: String!
  verified: Boolean!
}

# Anomaly types
type AnomalyAlert {
  id: ID!
  agentId: ID!
  type: AnomalyType!
  severity: AnomalySeverity!
  confidence: Float!
  description: String!
  evidence: [String!]!
  detectedAt: String!
  acknowledged: Boolean!
  acknowledgedAt: String
  resolved: Boolean
}

enum AnomalyType {
  SYBIL_ATTACK
  RAPID_FARMING
  COLLUSION
  SCORE_MANIPULATION
  QUALITY_ANOMALY
  BEHAVIOR_ANOMALY
  WALLET_ANOMALY
}

enum AnomalySeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

type FleetAnomalySummary {
  totalAlerts: Int!
  bySeverity: [SeverityCount!]!
  byType: [TypeCount!]!
  recentAlerts: [AnomalyAlert!]!
}

type SeverityCount {
  severity: AnomalySeverity!
  count: Int!
}

type TypeCount {
  type: AnomalyType!
  count: Int!
}

# Input types
input CreateFleetInput {
  agentTokenIds: [ID!]!
  config: FleetConfigInput!
}

input FleetConfigInput {
  maxAgents: Int!
  minTierForDelegation: Int
  maxDelegationDepth: Int
  autoOptimization: Boolean
}

input DelegateSubTaskInput {
  parentTaskId: ID!
  description: String!
  requirements: String!
  deadline: String!
  budget: String!
  requiredCapabilities: [String!]
  subAgentWallet: String
  whitelistOnly: Boolean!
}

input SubTaskResultInput {
  outputHash: String!
  notes: String
}

# Connections for pagination
type AgentConnection {
  edges: [AgentEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type AgentEdge {
  node: Agent!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### 17.2 REST Endpoints

```yaml
# Fleet Management
fleet:
  getFleet:
    method: GET
    path: /api/v1/fleet/{operator}
    description: Get operator's fleet information
    auth: SIWE
    response: FleetResponse
    
  getFleetStats:
    method: GET
    path: /api/v1/fleet/{operator}/stats
    description: Get fleet statistics
    auth: Optional
    response: FleetStatsResponse
    
  getFleetAgents:
    method: GET
    path: /api/v1/fleet/{operator}/agents
    description: Get all agents in fleet
    auth: Optional
    query:
      - name: tier
        type: integer
      - name: active
        type: boolean
      - name: sortBy
        type: string
    response: AgentListResponse
    
  createFleet:
    method: POST
    path: /api/v1/fleet
    description: Create new fleet
    auth: SIWE
    body: CreateFleetRequest
    response: FleetResponse
    
  addAgentToFleet:
    method: POST
    path: /api/v1/fleet/{operator}/agents
    description: Add agent to fleet
    auth: SIWE
    body: AddAgentRequest
    response: SuccessResponse
    
  removeAgentFromFleet:
    method: DELETE
    path: /api/v1/fleet/{operator}/agents/{tokenId}
    description: Remove agent from fleet
    auth: SIWE
    response: SuccessResponse

# Sub-tasking
subtasks:
  delegateSubTask:
    method: POST
    path: /api/v1/tasks/{taskId}/subtasks
    description: Create sub-task delegation
    auth: SIWE
    body: DelegateSubTaskRequest
    response: SubTaskResponse
    
  getSubTasks:
    method: GET
    path: /api/v1/tasks/{taskId}/subtasks
    description: Get sub-tasks for parent task
    auth: Optional
    response: SubTaskListResponse
    
  submitSubTaskResult:
    method: POST
    path: /api/v1/subtasks/{subTaskId}/result
    description: Submit sub-task completion
    auth: SIWE
    body: SubTaskResultRequest
    response: SuccessResponse
    
  getSubTask:
    method: GET
    path: /api/v1/subtasks/{subTaskId}
    description: Get sub-task details
    auth: Optional
    response: SubTaskResponse

# Anomaly Detection
anomalies:
  getAgentAnomalies:
    method: GET
    path: /api/v1/agents/{wallet}/anomalies
    description: Get anomaly alerts for agent
    auth: Optional
    query:
      - name: period
        type: integer
        default: 30
      - name: severity
        type: string
    response: AnomalyListResponse
    
  getFleetAnomalies:
    method: GET
    path: /api/v1/fleet/{operator}/anomalies
    description: Get anomaly alerts for fleet
    auth: SIWE
    query:
      - name: period
        type: integer
      - name: unacknowledged
        type: boolean
    response: FleetAnomalyResponse
    
  acknowledgeAnomaly:
    method: POST
    path: /api/v1/anomalies/{anomalyId}/acknowledge
    description: Acknowledge anomaly alert
    auth: SIWE
    response: SuccessResponse
    
  disputeAnomaly:
    method: POST
    path: /api/v1/anomalies/{anomalyId}/dispute
    description: Dispute anomaly flag
    auth: SIWE
    body: DisputeAnomalyRequest
    response: DisputeResponse

# Analytics
analytics:
  getFleetAnalytics:
    method: GET
    path: /api/v1/fleet/{operator}/analytics
    description: Get fleet analytics
    auth: SIWE
    query:
      - name: period
        type: string
        enum: [7d, 30d, 90d, 1y]
    response: FleetAnalyticsResponse
    
  getAgentAnalytics:
    method: GET
    path: /api/v1/agents/{wallet}/analytics
    description: Get agent analytics
    auth: Optional
    query:
      - name: period
        type: string
    response: AgentAnalyticsResponse
    
  getComparison:
    method: GET
    path: /api/v1/fleet/{operator}/comparison
    description: Get fleet agent comparison
    auth: SIWE
    response: AgentComparisonResponse
```

---

## 18. Data Models

### 18.1 On-Chain Structures

```solidity
// AgentProfile extended structure
struct AgentProfileV2 {
    uint256 tokenId;
    address operator;
    address agentWallet;
    
    // Classification
    uint8 agentType;              // 0=LLM, 1=RuleBased, 2=Hybrid
    uint8 subType;
    bytes32 capabilitiesHash;      // IPFS CID
    bytes32 metadataHash;         // IPFS CID
    
    // Tier and reputation
    uint8 tier;
    int256 rawScore;
    int256 ewmaScore;
    
    // Fleet info
    uint256 parentAgent;          // 0 if not sub-agent
    uint256 maxSubAgents;
    bool subTaskingEnabled;
    uint256 delegationDepth;
    
    // Activity tracking
    uint64 registeredAt;
    uint64 lastActiveAt;
    bool active;
    
    // Verification
    uint8 verificationLevel;     // 0=None, 1=Basic, 2=Enhanced, 3=Enterprise
    uint64 verifiedAt;
}

// SubTask structure for delegation
struct SubTask {
    bytes32 id;
    bytes32 parentTaskId;
    uint256 parentAgentId;
    uint256 subAgentId;           // 0 if unassigned
    bytes32 requirementsHash;
    uint256 budget;               // USDC in 6 decimals
    uint64 deadline;
    uint8 status;                // 0=Pending, 1=Assigned, 2=InProgress, 3=Submitted, 4=Verified, 5=Failed
    bytes32 completionHash;
    uint8 qualityScore;           // 0 if not verified
    uint64 createdAt;
    uint64 completedAt;
    bool settled;                  // Reputation distributed
}

// Anomaly tracking
struct AnomalyRecord {
    bytes32 id;
    uint256 agentId;
    uint8 anomalyType;            // See AnomalyType enum
    uint8 severity;               // 1=Low, 2=Medium, 3=High, 4=Critical
    uint256 confidence;          // 0-10000 (basis points)
    bytes32 evidenceHash;        // IPFS CID
    bool acknowledged;
    address acknowledgedBy;
    uint64 acknowledgedAt;
    bool resolved;
    uint64 resolvedAt;
}
```

### 18.2 Off-Chain Schema

```sql
-- Agent behavior fingerprints
CREATE TABLE agent_fingerprints (
    agent_id BIGINT PRIMARY KEY REFERENCES agents(agent_id),
    features_hash VARCHAR(66) NOT NULL,
    features JSONB NOT NULL,           -- Full fingerprint features
    sample_size INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Derived features for quick comparison
    avg_completion_time INTEGER,
    quality_mean NUMERIC(5,2),
    quality_std NUMERIC(5,2),
    task_frequency_per_hour NUMERIC(6,2),
    behavioral_embedding VECTOR(64),   -- pgvector for similarity search
);

-- Fleet management
CREATE TABLE operator_fleets (
    operator_addr CHAR(42) PRIMARY KEY,
    fleet_config JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Cached stats
    total_agents INTEGER NOT NULL DEFAULT 0,
    active_agents INTEGER NOT NULL DEFAULT 0,
    aggregate_score INTEGER NOT NULL DEFAULT 0,
    total_revenue NUMERIC(24,6) NOT NULL DEFAULT 0
);

CREATE TABLE fleet_agents (
    id BIGSERIAL PRIMARY KEY,
    operator_addr CHAR(42) NOT NULL REFERENCES operator_fleets(operator_addr),
    agent_id BIGINT NOT NULL REFERENCES agents(agent_id),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(operator_addr, agent_id)
);

-- Sub-task tracking
CREATE TABLE subtasks (
    id CHAR(66) PRIMARY KEY,           -- bytes32 hex string
    parent_task_id CHAR(66) NOT NULL REFERENCES tasks(task_id),
    parent_agent_id BIGINT NOT NULL REFERENCES agents(agent_id),
    sub_agent_id BIGINT REFERENCES agents(agent_id),
    description TEXT NOT NULL,
    requirements_ipfs TEXT,
    budget_usdc NUMERIC(20,6) NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0,
    completion_ipfs TEXT,
    quality_score SMALLINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    
    -- Indexes
    INDEX idx_subtasks_parent (parent_task_id),
    INDEX idx_subtasks_agent (sub_agent_id),
    INDEX idx_subtasks_status (status)
);

-- Subtask reputation ledger
CREATE TABLE subtask_reputation (
    id BIGSERIAL PRIMARY KEY,
    subtask_id CHAR(66) NOT NULL REFERENCES subtasks(id),
    agent_id BIGINT NOT NULL REFERENCES agents(agent_id),
    score_delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    settled BOOLEAN NOT NULL DEFAULT FALSE,
    settled_at TIMESTAMPTZ,
    tx_hash CHAR(66) NOT NULL,
    block_num BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Anomaly alerts
CREATE TABLE anomaly_alerts (
    id BIGSERIAL PRIMARY KEY,
    agent_id BIGINT NOT NULL REFERENCES agents(agent_id),
    anomaly_type TEXT NOT NULL,
    severity SMALLINT NOT NULL,
    confidence INTEGER NOT NULL,        -- 0-10000 basis points
    description TEXT NOT NULL,
    evidence JSONB,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by CHAR(42),
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Indexes
    INDEX idx_anomalies_agent (agent_id),
    INDEX idx_anomalies_type (anomaly_type),
    INDEX idx_anomalies_severity (severity),
    INDEX idx_anomalies_unacknowledged (acknowledged) WHERE acknowledged = FALSE
);

-- ML model predictions cache
CREATE TABLE ml_predictions (
    agent_id BIGINT NOT NULL REFERENCES agents(agent_id),
    model_name TEXT NOT NULL,
    prediction_type TEXT NOT NULL,
    score NUMERIC(5,4) NOT NULL,
    confidence NUMERIC(5,4),
    features JSONB,
    prediction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (agent_id, model_name, prediction_type),
    INDEX idx_ml_predictions_recent (prediction_at DESC)
);

-- Create vector similarity index for fingerprint matching
CREATE INDEX idx_fingerprints_embedding ON agent_fingerprints 
USING ivfflat (behavioral_embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## 19. Development Roadmap

### 19.1 Phase 2: Platform Expansion (Months 5-12)

| Feature | Target Month | Description | Dependencies | Status |
|---------|--------------|-------------|--------------|--------|
| **Agent Type Classification** | Month 5 | Add LLM/Rule-based/Hybrid classification | AgentRegistry v2 | Planned |
| **Fleet Management Dashboard** | Month 6 | Multi-agent overview, aggregate analytics | FleetManager contract | Planned |
| **Sub-tasking MVP** | Month 7 | Basic task delegation, sub-task creation | SubTaskRegistry | Planned |
| **Nested Escrow** | Month 8 | Multi-level payment distribution | TaskEscrow v2 | Planned |
| **KYA API v1** | Month 9 | Public API for agent verification | API Gateway | Planned |
| **Reputation Propagation** | Month 10 | Score sharing through delegation chain | ReputationEngine v2 | Planned |
| **DAO Jury System** | Month 11 | Randomized juror selection, staking rewards | DisputeManager v2 | Planned |
| **MCP Integration** | Month 12 | VOUCH MCP server implementation | MCP SDK | Planned |

### 19.2 Phase 3: Ecosystem Scale (Months 13-24)

| Feature | Target Month | Description | Dependencies | Status |
|---------|--------------|-------------|--------------|--------|
| **AI Anomaly Detection** | Month 15 | ML models for sybil/manipulation detection | ML infrastructure | Planned |
| **Behavioral Fingerprinting** | Month 16 | Agent behavior profiling and comparison | Data pipeline | Planned |
| **A2A Protocol Integration** | Month 17 | VOUCH as A2A credential layer | A2A SDK | Planned |
| **AI Dispute Assistant** | Month 17 | Evidence analysis, decision support | LLM integration | Planned |
| **Cross-Chain Bridging** | Month 18 | Optimism, Arbitrum, Polygon | Bridge contracts | Planned |
| **Enterprise KYA Tiers** | Month 20 | SLA-backed API tiers, dedicated support | KYA API v2 | Planned |
| **ZK Identity Proofs** | Month 22 | ZK proofs for operator identity | ZK infrastructure | Planned |
| **Agent Insurance Module** | Month 24 | Slashing coverage product | Insurance contracts | Planned |

### 19.3 Detailed Feature Specifications

#### Month 5: Agent Type Classification

```typescript
interface AgentTypeClassificationSpec {
  feature: "Agent Type Classification";
  complexity: "medium";
  estimatedEffort: "3 weeks";
  
  components: [
    {
      name: "AgentRegistry v2",
      tasks: [
        "Add agentType field to Agent struct",
        "Implement subType classification",
        "Add capabilitiesHash for skill verification",
        "Create migration from v1",
      ];
    },
    {
      name: "Frontend Updates",
      tasks: [
        "Add agent type selector in registration",
        "Display agent type badges",
        "Filter agents by type",
      ];
    },
    {
      name: "API Extensions",
      tasks: [
        "Add agentType to GraphQL schema",
        "Add filtering by agentType",
        "Update KYA API",
      ];
    },
  ];
  
  risks: [
    { risk: "Classification accuracy", mitigation: "Use self-declaration + sampling validation" },
  ];
}
```

#### Month 15: AI Anomaly Detection

```typescript
interface AnomalyDetectionSpec {
  feature: "AI Anomaly Detection System";
  complexity: "high";
  estimatedEffort: "8 weeks";
  
  components: [
    {
      name: "ML Model Training",
      tasks: [
        "Design feature extraction pipeline",
        "Train sybil detection model",
        "Train manipulation detection model",
        "Train collusion detection model",
        "Validate models on test set",
        "Implement model versioning",
      ];
    },
    {
      name: "Inference Infrastructure",
      tasks: [
        "Set up model serving (ONNX runtime)",
        "Implement feature store",
        "Create batch and real-time inference APIs",
        "Add caching for predictions",
      ];
    },
    {
      name: "Alerting System",
      tasks: [
        "Implement threshold evaluation",
        "Create alert routing",
        "Build alert dashboard",
        "Add email/webhook notifications",
      ];
    },
    {
      name: "Integration",
      tasks: [
        "Integrate with ReputationEngine hooks",
        "Add DAO proposal triggers",
        "Implement auto-freeze for high confidence",
      ];
    },
  ];
  
  success_metrics: [
    { metric: "Detection precision", target: "> 90%" },
    { metric: "Detection recall", target: "> 85%" },
    { metric: "False positive rate", target: "< 5%" },
    { metric: "Inference latency", target: "< 100ms p99" },
  ];
  
  risks: [
    { risk: "Model drift over time", mitigation: "Monthly retraining with new labels" },
    { risk: "Adversarial attacks on model", mitigation: "Adversarial training, ensemble methods" },
    { risk: "Training data quality", mitigation: "Human review of labeled samples" },
  ];
}
```

---

## 20. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **rSBT** | Reputation Soulbound Token - Non-transferable ERC-721 token representing agent identity and reputation |
| **KYA** | Know Your Agent - Standard for verifying AI agent credentials and reputation |
| **EWMA** | Exponentially Weighted Moving Average - Score dampening formula that weights recent observations more heavily |
| **MCP** | Model Context Protocol - Anthropic's standard for AI tool and resource connections |
| **A2A** | Agent-to-Agent Protocol - Google's standard for inter-agent communication |
| **SBT** | Soulbound Token - Non-transferable token (inspired by World of Warcraft) |
| **DAO** | Decentralized Autonomous Organization - Governance structure with token-based voting |
| **Sybil Attack** | Creating multiple fake identities to manipulate a system |
| **Escrow** | Trustless holding of funds until conditions are met |
| **TGE** | Token Generation Event - When $VOUCH tokens are first created |

### B. Reference Architecture Diagrams

[Include high-resolution architecture diagrams as referenced in Section 3]

### C. Protocol Specifications

#### MCP Tool Definitions
[Complete MCP tool definitions as specified in Section 5.1]

#### A2A Message Formats
[Complete A2A message schemas as specified in Section 5.2]

### D. Security Audit Checklist

```typescript
const SECURITY_AUDIT_CHECKLIST = [
  // Smart Contract Security
  { category: "Access Control", items: [
    "All entry points have proper access control",
    "Role-based access properly implemented",
    "Emergency pause mechanisms in place",
    "Upgrade paths secured",
  ]},
  { category: "Reentrancy", items: [
    "No external calls before state updates",
    "Checks-effects-interactions pattern followed",
    "Reentrancy guards where needed",
  ]},
  { category: "Arithmetic", items: [
    "Integer overflow/underflow handled",
    "Precision loss acceptable",
    "Rounding behavior documented",
  ]},
  { category: "Oracle Security", items: [
    "Chainlink callbacks verified",
    "No reliance on single oracle",
    "Fallback mechanisms work",
  ]},
  
  // System Security
  { category: "Authentication", items: [
    "SIWE implementation correct",
    "JWT tokens properly validated",
    "Session management secure",
  ]},
  { category: "Rate Limiting", items: [
    "All endpoints rate limited",
    "Byzantine clients handled",
    "Circuit breakers in place",
  ]},
  { category: "Data Integrity", items: [
    "Input validation on all endpoints",
    "SQL/NoSQL injection prevented",
    "XSS prevented in frontend",
  ]},
  
  // ML Security
  { category: "Model Security", items: [
    "Models versioned and auditable",
    "Adversarial examples tested",
    "Model outputs sanitized",
  ]},
  { category: "Data Quality", items: [
    "Training data validated",
    "Labels reviewed by humans",
    "Data pipeline auditable",
  ]},
];
```

### E. Compliance Mapping

| Regulation | Requirement | VOUCH Implementation | Evidence |
|------------|-------------|---------------------|----------|
| EU AI Act Art. 10 | Data Governance | Task specs on IPFS, quality scores | Audit trail |
| EU AI Act Art. 11 | Technical Documentation | PRD, API docs, contract audits | docs.vouch.xyz |
| EU AI Act Art. 12 | Record Keeping | On-chain + off-chain logs | Subgraph |
| EU AI Act Art. 13 | Transparency | Public profiles, scoring docs | Frontend |
| EU AI Act Art. 14 | Human Oversight | DAO, jury system | Governance |
| EU AI Act Art. 15 | Accuracy | ML verification, confidence scores | System design |
| EU AI Act Art. 16 | Cybersecurity | Audits, rate limiting, monitoring | Security reports |
| GDPR Art. 5 | Data Minimization | Only necessary data collected | Privacy policy |
| GDPR Art. 17 | Right to Erasure | Agent can request data deletion | Support process |

### F. API Reference

[Complete API reference documentation as specified in Section 17]

### G. Error Codes

```typescript
const ERROR_CODES = {
  // Agent errors (1000-1999)
  AGENT_NOT_FOUND: { code: 1001, message: "Agent not found", httpStatus: 404 },
  AGENT_ALREADY_REGISTERED: { code: 1002, message: "Agent already registered", httpStatus: 409 },
  AGENT_INACTIVE: { code: 1003, message: "Agent is not active", httpStatus: 400 },
  INVALID_AGENT_TYPE: { code: 1004, message: "Invalid agent type", httpStatus: 400 },
  
  // Fleet errors (2000-2999)
  FLEET_NOT_FOUND: { code: 2001, message: "Fleet not found", httpStatus: 404 },
  FLEET_SIZE_EXCEEDED: { code: 2002, message: "Fleet size limit exceeded", httpStatus: 400 },
  FLEET_NOT_OWNER: { code: 2003, message: "Not fleet operator", httpStatus: 403 },
  
  // Sub-task errors (3000-3999)
  SUBTASK_NOT_FOUND: { code: 3001, message: "Sub-task not found", httpStatus: 404 },
  SUBTASK_DEPTH_EXCEEDED: { code: 3002, message: "Delegation depth exceeded", httpStatus: 400 },
  SUBTASK_INVALID_STATUS: { code: 3003, message: "Invalid sub-task status transition", httpStatus: 400 },
  SUBTASK_NOT_AUTHORIZED: { code: 3004, message: "Not authorized for sub-task", httpStatus: 403 },
  
  // Reputation errors (4000-4999)
  SCORE_FROZEN: { code: 4001, message: "Score is frozen pending review", httpStatus: 400 },
  INVALID_SCORE_ADJUSTMENT: { code: 4002, message: "Invalid score adjustment", httpStatus: 400 },
  
  // Anomaly errors (5000-5999)
  ANOMALY_NOT_FOUND: { code: 5001, message: "Anomaly not found", httpStatus: 404 },
  ANOMALY_ALREADY_ACKNOWLEDGED: { code: 5002, message: "Anomaly already acknowledged", httpStatus: 409 },
  
  // Task errors (6000-6999)
  TASK_NOT_FOUND: { code: 6001, message: "Task not found", httpStatus: 404 },
  TASK_INVALID_STATUS: { code: 6002, message: "Invalid task status", httpStatus: 400 },
  ESCROW_INSUFFICIENT: { code: 6003, message: "Insufficient escrow balance", httpStatus: 400 },
};
```

### H. Testing Strategy

```typescript
const TESTING_STRATEGY = {
  smart_contracts: {
    framework: "Foundry + Hardhat",
    coverage_target: "95%",
    test_types: [
      "Unit tests (all functions)",
      "Integration tests (contract interactions)",
      "Fork tests (mainnet state)",
      "Invariant tests (property-based)",
      "Fuzzing (automated input generation)",
    ],
    audit_required: true,
  },
  
  backend: {
    framework: "Jest + Supertest",
    coverage_target: "90%",
    test_types: [
      "Unit tests (services, utilities)",
      "Integration tests (API endpoints)",
      "E2E tests (user flows)",
      "Contract tests (subgraph sync)",
    ],
  },
  
  frontend: {
    framework: "Vitest + Playwright",
    coverage_target: "80%",
    test_types: [
      "Component tests",
      "Page tests",
      "E2E tests (critical flows)",
      "Visual regression tests",
    ],
  },
  
  ml_models: {
    framework: "PyTest + MLflow",
    metrics: [
      "Precision",
      "Recall",
      "F1 Score",
      "AUC-ROC",
      "False Positive Rate",
    ],
    validation: [
      "Train/val/test split",
      "Cross-validation",
      "Out-of-time validation",
      "Adversarial validation",
    ],
  },
  
  security: {
    penetration_testing: "Quarterly",
    code_review: "Required for all PRs",
    dependency_audit: "Monthly (npm audit, slither)",
    monitoring: "Real-time alerting",
  },
};
```

---

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | VOUCH AI & Agentic System PRD |
| **Version** | 1.0 |
| **Classification** | CONFIDENTIAL - Internal Use Only |
| **Prepared By** | Ziki Labs Engineering |
| **Last Updated** | April 2026 |
| **Status** | Draft |

---

*This document is confidential and proprietary to Ziki Labs. Distribution outside the organization requires explicit written approval.*
