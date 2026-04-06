# 🔍 DebugAI — AI-Powered Root Cause Analysis Platform

> Automatically identify root causes of bugs across microservices using LangGraph + Groq + Qdrant

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND (Vite)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Input Form  │  │  Results     │  │  Chat Assistant      │  │
│  │  (logs/trace)│  │  (RCA+Fixes) │  │  (follow-up Q&A)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                     FASTAPI BACKEND                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              LangGraph Pipeline                          │   │
│  │                                                          │   │
│  │  START → parse_errors → retrieve_similar → classify →   │   │
│  │          root_cause → fix_suggest → summarize → END      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────┐    ┌──────────────────────────────────┐    │
│  │  Chat Agent     │    │  REST API Routes                 │    │
│  │  (LangChain +   │    │  /analyze /chat /ingest /search  │    │
│  │   Groq LLM)     │    │  /examples                       │    │
│  └─────────────────┘    └──────────────────────────────────┘    │
└────────┬─────────────────────────────────────┬──────────────────┘
         │                                     │
┌────────▼──────────┐              ┌───────────▼──────────────────┐
│   GROQ API        │              │   QDRANT CLOUD               │
│   LLaMA 3.3 70B   │              │   Vector Store               │
│   (Inference)     │              │   (Semantic Search)          │
└───────────────────┘              └──────────────────────────────┘
```

---

## 🔄 LangGraph Pipeline (6 Nodes)

```
Node 1: parse_errors
  → Extracts structured errors from raw logs/stack traces using Groq LLM
  → Output: List of {error_type, message, file, line, service}

Node 2: retrieve_similar
  → Embeds error context using sentence-transformers (all-MiniLM-L6-v2)
  → Searches Qdrant vector store for historically similar bugs
  → Output: Top-3 similar issues with resolutions

Node 3: classify
  → Determines severity: low / medium / high / critical
  → Identifies affected microservices
  → Output: severity label + service list

Node 4: root_cause
  → Deep causal analysis using all gathered context
  → Considers cascading failures across services
  → Output: Ranked root causes with confidence scores

Node 5: fix_suggest
  → Generates actionable fixes with before/after code examples
  → Draws on similar resolved issues from Qdrant
  → Output: Prioritized fix list

Node 6: summarize
  → Creates executive summary for stakeholder communication
  → Output: 2-3 sentence summary
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key (free at https://console.groq.com)
- Qdrant account (free at https://cloud.qdrant.io)

### 1. Clone & Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys:
# GROQ_API_KEY=gsk_...
# QDRANT_URL=https://your-cluster.qdrant.io:6333
# QDRANT_API_KEY=your-qdrant-api-key
```

### 2. Install Backend Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start Backend

```bash
python main.py
# Backend runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 4. Install & Start Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 📁 Project Structure

```
debugai/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── api/
│   │   ├── models.py              # Pydantic schemas
│   │   ├── routes.py              # REST API endpoints
│   │   └── websocket.py          # WebSocket streaming
│   ├── graph/
│   │   ├── state.py              # LangGraph TypedDict state
│   │   ├── nodes.py              # 6 pipeline nodes
│   │   └── pipeline.py           # Graph builder & compiler
│   ├── agents/
│   │   └── chat_agent.py         # Conversational debug assistant
│   └── vectorstore/
│       └── qdrant_store.py        # Qdrant init, search, ingest
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── store/
        │   └── debugStore.js      # Zustand global state
        ├── services/
        │   └── api.js             # Axios + WebSocket client
        ├── components/
        │   ├── Layout.jsx         # Sidebar navigation
        │   ├── DebugInputForm.jsx # Input form with examples
        │   ├── AnalysisProgress.jsx
        │   ├── ResultsPanel.jsx   # RCA + fixes display
        │   └── ChatPanel.jsx      # Chat assistant
        └── pages/
            ├── AnalyzePage.jsx    # Main analysis page
            ├── KnowledgePage.jsx  # Knowledge base search
            └── IngestPage.jsx     # Add resolved issues
```

---

## 🔑 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GROQ_API_KEY` | Groq API key for LLaMA 3.3 70B | Required |
| `QDRANT_URL` | Qdrant cluster URL | Required |
| `QDRANT_API_KEY` | Qdrant API key | Required |
| `QDRANT_COLLECTION` | Collection name | `debugai_knowledge` |
| `EMBEDDING_MODEL` | HuggingFace embedding model | `all-MiniLM-L6-v2` |
| `GROQ_MODEL` | Groq model ID | `llama-3.3-70b-versatile` |

---

## 🆓 Open Source Stack

| Component | Technology | License |
|---|---|---|
| LLM Inference | Groq + LLaMA 3.3 70B | Free tier available |
| Orchestration | LangGraph + LangChain | MIT |
| Vector DB | Qdrant Cloud | Free tier (1GB) |
| Embeddings | sentence-transformers / all-MiniLM-L6-v2 | Apache 2.0 |
| Backend | FastAPI + Python | MIT |
| Frontend | React + Vite + Tailwind | MIT |
| State | Zustand | MIT |

---

## 📡 API Reference

### POST /api/v1/analyze
Run full root cause analysis pipeline.

```json
{
  "session_id": "abc123",
  "logs": "raw log output...",
  "stack_trace": "Traceback (most recent call last)...",
  "code_snippet": "def my_function()...",
  "user_description": "Service crashes every 30 minutes",
  "language": "python",
  "services": [{"name": "order-service", "language": "python"}]
}
```

### POST /api/v1/chat
Conversational follow-up about the analysis.

### GET /api/v1/search?q=query
Semantic search in knowledge base.

### POST /api/v1/ingest
Add a resolved issue to the knowledge base.

### WebSocket /ws/analyze
Stream real-time analysis progress events.

---

## 💡 Advanced Usage: Microservices

DebugAI excels at cross-service debugging. When you provide:
1. Logs from multiple services
2. Service names via the "Add Microservices" input
3. Distributed stack traces

The LangGraph `classify` node identifies which services are affected, and the `root_cause` node performs cascading failure analysis to trace the root cause back to the originating service.

---

## 🔮 Extending the Platform

- **Add tools**: Extend `graph/nodes.py` with new LangGraph nodes
- **Custom embeddings**: Change `EMBEDDING_MODEL` to any HuggingFace model
- **MCP Integration**: Add MCP servers to the chat agent for GitHub/Jira integration
- **New LLMs**: Swap Groq for Ollama (local) by changing `ChatGroq` to `ChatOllama`
