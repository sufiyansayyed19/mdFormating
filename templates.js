/**
 * Sample Markdown Document Templates (Enhanced with JSON, Terminal, SQL & Code blocks)
 */
const TEMPLATES = {
  'tech-spec': `# Project Quantum: High-Performance Cache Layer
**Document Version:** 1.2.0 • **Author:** Cloud Architecture Team • **Status:** Approved
**Target Release:** Q3 2027 • **Confidentiality:** Internal Only

---

## 1. Executive Summary

Project Quantum delivers a low-latency, distributed in-memory cache architecture designed to reduce 99th-percentile API response latency from **280ms** down to under **15ms** across regional availability zones.

> [!NOTE]
> All benchmarks mentioned in this specification were gathered under peak load conditions simulating 250,000 requests per second.

---

## 2. Architecture Overview & Metrics

Quantum operates as a cluster of distributed nodes utilizing consistent hashing and asynchronous replication.

| Metric | Current Legacy | Quantum Target | Improvement |
| :--- | :--- | :--- | :--- |
| **p95 Latency** | 185 ms | **8.2 ms** | 95.5% faster |
| **p99 Latency** | 340 ms | **14.1 ms** | 95.8% faster |
| **Memory Footprint** | 64 GB / node | **24 GB / node** | 62.5% reduction |
| **Failover Recovery** | 45 seconds | **< 1.8 seconds** | Zero-downtime |

---

## 3. Node Configuration (JSON Specification)

Each Quantum node is configured via a validated JSON schema specifying cluster topology, TTL evictions, and memory pools:

\`\`\`json
{
  "clusterName": "quantum-prod-us-east",
  "version": "1.2.0",
  "port": 7000,
  "memory": {
    "maxCapacityGb": 24,
    "evictionPolicy": "volatile-lru",
    "compression": true
  },
  "replication": {
    "factor": 3,
    "syncMode": "async",
    "heartbeatIntervalMs": 250
  },
  "security": {
    "tls": "1.3",
    "authTokens": ["vault:secret/quantum/auth-token"]
  }
}
\`\`\`

<!-- pagebreak -->

## 4. Implementation Code (TypeScript)

Below is the connection pool initialisation and auto-retry policy implementation:

\`\`\`typescript
import { QuantumCluster, RetryStrategy } from '@quantum/cache-engine';

export async function bootstrapCache(): Promise<QuantumCluster> {
  const cluster = new QuantumCluster({
    seedNodes: ['cache-us-east-1a:7000', 'cache-us-east-1b:7000'],
    connectionTimeoutMs: 250,
    retryPolicy: RetryStrategy.exponentialBackoff({
      maxRetries: 3,
      baseDelayMs: 20,
    }),
  });

  await cluster.connect();
  console.log('⚡ Quantum Cache Cluster connected with 0 errors.');
  return cluster;
}
\`\`\`

---

## 5. Deployment & CLI Benchmarking (Terminal / Shell)

Execute the health check and high-concurrency warmup script:

\`\`\`bash
# 1. Verify cluster quorum status
quantum-cli status --cluster=quantum-prod-us-east

# 2. Warm up cache keys with pipeline concurrency of 128 workers
quantum-cli warmup --data-source=s3://telemetry/seed.json --concurrency=128

# 3. Stream real-time p99 latency metrics
curl -s http://localhost:7000/metrics | grep "quantum_latency_p99"
\`\`\`

---

## 6. Audit Telemetry Analysis (SQL Query)

Query latency degradation anomalies across availability zones:

\`\`\`sql
SELECT 
  node_id,
  region,
  COUNT(*) AS total_queries,
  ROUND(AVG(latency_ms), 2) AS avg_latency,
  MAX(latency_ms) AS max_p99
FROM quantum_telemetry_logs
WHERE timestamp >= NOW() - INTERVAL '24 HOURS'
GROUP BY node_id, region
HAVING AVG(latency_ms) > 12.0
ORDER BY avg_latency DESC;
\`\`\`

> [!TIP]
> Keep the retry base delay at 20ms to avoid thundering-herd scenarios during failovers.
`,

  'api-diagrams': `# API Flow & System Architecture Diagrams
**Service Mesh Overview** • Gateway Port \`8000\` • Microservices \`8001\`–\`8004\`

---

## 1. Gateway Routing & Service Topology

\`\`\`mermaid
flowchart LR
    Client["Client / Swagger"] -->|"HTTPS + X-Request-ID"| GW["API Gateway (:8000)"]
    GW -->|"/internal/* -> 404"| Blocked["404 BLOCKED"]
    GW -->|"/api/v1/auth/*"| Auth["User/Auth (:8001)"]
    GW -->|"/api/v1/vehicles/*"| Veh["Vehicle (:8002)"]
    GW -->|"/api/v1/parking/*"| Park["Parking (:8003)"]
    GW -->|"/api/v1/payments/*"| Pay["Payment (:8004)"]

    Park -.->|"GET /api/v1/vehicles/{id}"| Veh
    Park -.->|"POST /internal/v1/payments"| Pay
    Pay -.->|"POST /internal/v1/bookings/{id}/payment-result"| Park
\`\`\`

---

## 2. Atomic Booking & Payment Sequence

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway (:8000)
    participant P as Parking (:8003)
    participant PDB as parking_db
    participant PAY as Payment (:8004)

    C->>GW: POST /api/v1/parking/bookings (Idempotency-Key)
    GW->>P: Forward request (RS256 JWT validated)
    rect rgb(235, 245, 255)
        Note over P,PDB: Single PostgreSQL Transaction
        P->>PDB: SELECT compatible slot FOR UPDATE
        P->>PDB: INSERT Booking (PAYMENT_PENDING, 5m hold)
        P->>PDB: COMMIT
    end
    P->>PAY: POST /internal/v1/payments
    PAY-->>P: 201 {payment_id, status: PENDING}
    P-->>C: 201 {booking_id, slot_number, payment_id}
\`\`\`

<!-- pagebreak -->

## 3. Booking State Machine

\`\`\`mermaid
stateDiagram-v2
    [*] --> PAYMENT_PENDING: POST /bookings (5-min hold)
    PAYMENT_PENDING --> CONFIRMED: Payment callback SUCCESS
    PAYMENT_PENDING --> EXPIRED: Payment FAILED or Hold expired
    CONFIRMED --> CANCELLED: POST /cancel (> 5 min before start)
    EXPIRED --> [*]
    CANCELLED --> [*]
\`\`\`

---

## 4. Sample Booking Response (\`JSON\`)

\`\`\`json
{
  "booking_id": "bk_9f3c21a0",
  "slot_number": "EV-B1-04",
  "amount": 20,
  "currency": "INR",
  "status": "PAYMENT_PENDING",
  "hold_expires_at": "2026-11-23T15:35:00+05:30"
}
\`\`\`
`,

  'proposal': `# Strategic Modernization Proposal
### Next-Generation Customer Experience Platform
**Prepared For:** Enterprise Leadership Board  
**Prepared By:** Digital Transformation Practice  
**Date:** November 2026 • **Version:** 2.0

---

## 1. Context & Business Need

In response to changing enterprise customer expectations, our digital touchpoints require modernizing to a composable, cloud-native architecture. 

Our current multi-channel platform has served us well over the last 5 years, but now encounters scaling limits:

* **Siloed customer history** across web, mobile, and support portals.
* **Release cycles exceeding 6 weeks** for minor customer journey modifications.
* **Infrastructure overhead** increasing 24% year-over-year.

> [!TIP]
> Consolidating onto a unified API orchestrator will reduce release cycles from **6 weeks to under 4 days**.

---

## 2. Investment & Timeline Overview

| Phase | Focus Area | Deliverables | Projected ROI |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Foundation & IAM | Unified Single Sign-On, Zero-Trust network | 18% security posture gain |
| **Phase 2** | Core API Mesh | Real-time event streaming & customer sync | 40% reduction in sync lag |
| **Phase 3** | Frontend Experience | Micro-frontend portal with sub-second loads | 35% boost in user retention |
| **Phase 4** | AI Orchestration | Predictive ticket deflection & auto-triage | $1.2M annual support savings |

<!-- pagebreak -->

## 3. Projected Financial Impact

The total expected ROI over a 3-year amortization window:

\`\`\`json
{
  "currency": "USD",
  "projectedSavings": {
    "year1": 0,
    "year2": 2400000,
    "year3": 5800000
  },
  "paybackPeriodMonths": 14,
  "netPresentValue": 4650000
}
\`\`\`

> [!NOTE]
> Calculations factor in full license consolidation and cloud infrastructure downsizing.

---

## 4. Recommendations & Approvals

We recommend immediate approval of Phase 1 with a committed start date in **Q1 2027**.

**Authorized Signatures:**

*Executive Sponsor:* ___________________________ &nbsp;&nbsp;&nbsp;&nbsp; *Date:* ____________  
*Chief Technology Officer:* ___________________________ &nbsp;&nbsp;&nbsp;&nbsp; *Date:* ____________
`,

  'resume': `# Alex Morgan
**Senior Full-Stack Engineer & System Architect**  
*San Francisco, CA • alex.morgan@email.com • (555) 123-4567 • linkedin.com/in/alexmorgan*

---

## Professional Summary

Results-driven Senior Software Engineer with **8+ years of experience** building scalable distributed systems, high-traffic web applications, and resilient cloud infrastructure. Proven track record leading cross-functional teams to deliver zero-downtime microservices serving 10M+ daily active users.

---

## Core Competencies

* **Languages:** TypeScript, JavaScript, Python, Go, SQL, HTML5/CSS3
* **Frameworks & Libraries:** React, Next.js, Node.js, Express, Tailwind CSS, GraphQL
* **Cloud & DevOps:** AWS (ECS, Lambda, RDS), Docker, Kubernetes, CI/CD, Terraform
* **Databases:** PostgreSQL, Redis, DynamoDB, Elasticsearch

---

## Professional Experience

### **Lead Full-Stack Engineer** | Apex Systems Inc.  
*2023 – Present • San Francisco, CA*
* Architected a distributed transaction processing pipeline handling **$18M+ daily volume** with 99.99% uptime.
* Spearheaded migration from monolithic Ruby on Rails to Next.js + Node.js microservices, cutting page load times by **58%**.
* Mentored 7 junior and mid-level engineers, establishing engineering best practices, RFC processes, and automated testing.

<!-- pagebreak -->

### **Senior Software Engineer** | CloudScale Networks  
*2020 – 2023 • Seattle, WA*
* Designed and maintained real-time event analytics platform processing **1.2 billion events/day** using Kafka and Go.
* Reduced cloud infrastructure spending by **32% ($180K/year)** via container rightsizing and intelligent autoscaling policies.

---

## Education

**B.S. in Computer Science**  
University of Washington, Seattle • *Magna Cum Laude (GPA: 3.88/4.0)*

---

## Key Projects

* **OpenSource EventMesh:** Lightweight distributed pub/sub broker built with Go and WebSockets (1.4k GitHub Stars).
* **MarkPDF Studio:** Client-side privacy-first Markdown-to-PDF rendering engine.
`,

  'meeting': `# Executive Engineering Sync & Roadmap Review
**Date:** November 22, 2026 • **Time:** 10:00 AM – 11:30 AM EST  
**Location:** Main Boardroom & Virtual Video Link  
**Chair:** Sarah Jenkins (VP of Engineering) • **Minutes by:** Dev Team Lead

---

## 1. Attendees

* **Present:** Sarah Jenkins, Alex Rivera, Priya Patel, David Kim, Elena Rostova
* **Regrets:** Michael Chang (Client Site Visit)

---

## 2. Agenda Items

1. Review of Q4 Infrastructure Reliability Metrics
2. Demonstration of the New Markdown-to-PDF Reporting Studio
3. Security Audit Findings & Remediation Timeline
4. Hiring Goals for Q1 2027

---

## 3. Discussion Points & Decisions

### Item 1: Infrastructure Reliability
* The team achieved **99.98% uptime** in October, surpassing the 99.95% target.
* Latency spikes during Sunday database maintenance were mitigated by migrating backup operations to a read-replica.

### Item 2: PDF Reporting Automation
* The new internal studio allows generating high-fidelity proposals and specifications in seconds.
* **Decision:** Adopt the tool company-wide for engineering documentation and client project summaries.

> [!WARNING]
> Security patches for TLS libraries must be rolled out before December 1st to comply with external audit criteria.

---

## 4. Action Items

- [x] **David:** Complete database snapshot verification on staging
- [ ] **Elena:** Finalize the MarkPDF theme guidelines for client-facing exports
- [ ] **Priya:** Schedule candidate interviews for Senior SRE roles
- [ ] **Alex:** Submit patch proposal for TLS audit before Thursday
`
};
