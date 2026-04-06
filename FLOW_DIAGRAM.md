# DebugAI — Complete System Flow & Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND (Vite + Tailwind)                │
│                                                                     │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ DebugInputForm │  │  ResultsPanel    │  │   ChatPanel        │  │
│  │                │  │  - Root Causes   │  │   (LangChain Q&A)  │  │
│  │ • Logs         │  │  - Fix Diffs     │  │   - Follow-ups     │  │
│  │ • Stack Trace  │  │  - Similar Issues│  │   - Suggestions    │  │
│  │ • Code Snippet │  │  - Steps         │  │                    │  │
│  │ • Services     │  └──────────────────┘  └────────────────────┘  │
│  └───────┬────────┘                                                 │
└──────────┼──────────────────────────────────────────────────────────┘
           │ POST /api/v1/analyze (REST) or WS /ws/analyze (Stream)
┌──────────▼──────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  LangGraph State Machine                     │   │
│  │                                                              │   │
│  │   ┌──────────┐   ┌──────────┐   ┌──────────┐               │   │
│  │   │  parse_  │──▶│ retrieve_│──▶│ classify │               │   │
│  │   │  errors  │   │  similar │   │          │               │   │
│  │   └──────────┘   └──────────┘   └────┬─────┘               │   │
│  │                                       │                      │   │
│  │   ┌──────────┐   ┌──────────┐   ┌────▼─────┐               │   │
│  │   │summarize │◀──│fix_sugge-│◀──│root_cause│               │   │
│  │   │          │   │  st      │   │          │               │   │
│  │   └──────────┘   └──────────┘   └──────────┘               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────┐     ┌───────────────────────────────────┐   │
│  │   Chat Agent      │     │         REST Routes                │   │
│  │   (LangChain)     │     │  /analyze /chat /ingest /search   │   │
│  │   Groq LLaMA 3.3  │     │  /examples /health                │   │
│  └─────────┬─────────┘     └───────────────────────────────────┘   │
└────────────┼────────────────────────────────────────────────────────┘
             │
    ┌────────┴──────────────────────┐
    │                               │
┌───▼──────────────┐   ┌────────────▼──────────────────┐
│   GROQ API       │   │   QDRANT CLOUD / LOCAL        │
│                  │   │                               │
│  LLaMA 3.3 70B   │   │  Collection: debugai_knowledge│
│  (Free tier ok)  │   │  Embedding: all-MiniLM-L6-v2  │
│                  │   │  Distance: Cosine             │
│  Used by:        │   │                               │
│  • All LG nodes  │   │  Used by:                     │
│  • Chat agent    │   │  • retrieve_similar node      │
└──────────────────┘   │  • /search endpoint           │
                       │  • /ingest endpoint           │
                       └───────────────────────────────┘
```

---

## 2. LangGraph Pipeline — Detailed Node Flow

```
Input: { logs, stack_trace, code_snippet, services, user_description, language }
                                │
                                ▼
╔═══════════════════════════════════════════════════════════╗
║  Node 1: parse_errors                                     ║
║                                                           ║
║  LLM prompt → extract structured errors from raw text     ║
║  Output: [{ error_type, message, file, line, service }]   ║
╚═══════════════════════════╦═══════════════════════════════╝
                            │
                            ▼
╔═══════════════════════════════════════════════════════════╗
║  Node 2: retrieve_similar                                 ║
║                                                           ║
║  1. Build query from parsed errors + user description     ║
║  2. Embed query via SentenceTransformer (local)           ║
║  3. Cosine search in Qdrant (top 3 matches)               ║
║  Output: [{ title, description, resolution, score }]      ║
╚═══════════════════════════╦═══════════════════════════════╝
                            │
                            ▼
╔═══════════════════════════════════════════════════════════╗
║  Node 3: classify                                         ║
║                                                           ║
║  LLM prompt → severity level + affected services          ║
║  Output: severity (critical/high/medium/low)              ║
║          affected_services: ["order-svc", "user-svc"]     ║
╚═══════════════════════════╦═══════════════════════════════╝
                            │
                            ▼
╔═══════════════════════════════════════════════════════════╗
║  Node 4: root_cause                                       ║
║                                                           ║
║  LLM prompt with ALL context:                             ║
║  • Parsed errors                                          ║
║  • Similar historical issues (from Qdrant)                ║
║  • Code snippet (if provided)                             ║
║  • Affected services                                      ║
║                                                           ║
║  Output: [{ title, description, confidence, location }]   ║
╚═══════════════════════════╦═══════════════════════════════╝
                            │
                            ▼
╔═══════════════════════════════════════════════════════════╗
║  Node 5: fix_suggest                                      ║
║                                                           ║
║  LLM prompt → code diffs & actionable fixes               ║
║  References: root causes + similar resolved issues        ║
║  Output: [{ title, description, code_before, code_after}] ║
╚═══════════════════════════╦═══════════════════════════════╝
                            │
                            ▼
╔═══════════════════════════════════════════════════════════╗
║  Node 6: summarize                                        ║
║                                                           ║
║  LLM prompt → 2-3 sentence executive summary              ║
║  Output: summary string                                   ║
╚═══════════════════════════╦═══════════════════════════════╝
                            │
                            ▼
Output: DebugResponse { summary, severity, root_causes,
                        fixes, similar_issues, steps }
```

---

## 3. Qdrant Vector Store Flow

```
INGEST (store resolved issue):
  User submits issue → embed text (title + desc + resolution)
  → SentenceTransformer("all-MiniLM-L6-v2") → 384-dim vector
  → Qdrant.upsert(collection="debugai_knowledge", vector, payload)

RETRIEVE (during analysis):
  Build query from errors → embed query → 384-dim vector
  → Qdrant.search(top_k=3, score_threshold=0.3, cosine)
  → Returns: [(payload, similarity_score), ...]
  → Passed into root_cause node as historical context

COLD START (seed data):
  8 pre-built bug patterns seeded on first startup:
  - NullPointerException, Connection Pool Exhaustion,
  - Redis Cache Miss Storm, OOMKilled, gRPC Deadline,
  - asyncio RuntimeError, React useEffect Loop, Kafka Lag
```

---

## 4. Chat Agent Flow

```
User asks follow-up question
        │
        ▼
LangChain ChatGroq (llama-3.3-70b-versatile)
  + SystemPrompt (expert debugger persona)
  + Conversation history (last 10 turns)
  + User message
        │
        ▼
  LLM response (reply)
        │
        ▼
  Second LLM call → generate 3 follow-up suggestions
        │
        ▼
  Return { reply, suggestions[] }
```

---

## 5. API Endpoints

| Method | Path                    | Description                          |
|--------|-------------------------|--------------------------------------|
| POST   | /api/v1/analyze         | Run full LangGraph debug pipeline    |
| POST   | /api/v1/chat            | Chat follow-up with LangChain agent  |
| POST   | /api/v1/ingest          | Add resolved issue to Qdrant         |
| GET    | /api/v1/search?q=...    | Semantic search in knowledge base    |
| GET    | /api/v1/examples        | Get example debug inputs             |
| WS     | /ws/analyze             | Streaming analysis (real-time steps) |
| GET    | /health                 | Health check                         |
| GET    | /docs                   | FastAPI Swagger UI (auto-generated)  |

---

## 6. Tech Stack (100% Open Source)

| Layer        | Technology                    | License     |
|--------------|-------------------------------|-------------|
| LLM          | Groq API (LLaMA 3.3 70B)      | Free tier   |
| Orchestration| LangGraph 0.2.x               | MIT         |
| LLM Client   | LangChain + langchain-groq    | MIT         |
| Vector Store | Qdrant Cloud                  | Free tier   |
| Embeddings   | sentence-transformers (local) | Apache 2.0  |
| Backend      | FastAPI + Uvicorn             | MIT         |
| Frontend     | React 18 + Vite               | MIT         |
| Styling      | Tailwind CSS                  | MIT         |
| Animations   | Framer Motion                 | MIT         |
| Syntax HL    | react-syntax-highlighter      | MIT         |
| State        | Zustand                       | MIT         |

---

## 7. Data Flow for Microservice Bug Analysis

```
Input: Logs from 3 services (order-svc, user-svc, payment-svc)
       + Stack trace from order-svc
       + Services listed: [order-svc, user-svc, payment-svc]

parse_errors:
  → Extracts: NPE in order-svc:45, timeout in payment-svc:120

retrieve_similar:
  → Finds: "Connection Pool Exhaustion" (82% match)
           "gRPC Deadline Exceeded" (67% match)

classify:
  → Severity: HIGH
  → Affected: ["order-svc", "payment-svc"]

root_cause:
  → Cause 1 (92%): order-svc calling user-svc which is down
    → Cascading: order-svc → payment-svc timeout chain
  → Cause 2 (71%): Missing circuit breaker pattern

fix_suggest:
  → Fix 1: Add circuit breaker (Resilience4j/tenacity)
  → Fix 2: Add health checks between services
  → Fix 3: Implement retry with exponential backoff

summarize:
  → "A HIGH severity cascading failure in order-svc was caused
     by an unavailable user-svc dependency propagating timeouts
     to payment-svc. Implement circuit breakers immediately."
```
