"""
FastAPI REST Routes for DebugAI
"""
import uuid
from fastapi import APIRouter, HTTPException
from api.models import (
    DebugRequest, DebugResponse, ChatRequest, ChatResponse,
    IngestRequest, RootCause, Fix, SimilarIssue, Severity
)
from graph.pipeline import get_debug_graph
from agents.chat_agent import run_chat_agent
from vectorstore.qdrant_store import store_issue, search_similar

router = APIRouter()


@router.post("/analyze", response_model=DebugResponse)
async def analyze_debug(request: DebugRequest):
    """
    Main endpoint: Run the full LangGraph debug analysis pipeline.
    Accepts logs, stack traces, code snippets, and service info.
    Returns root causes, fixes, and similar issues.
    """
    if not any([request.logs, request.stack_trace, request.code_snippet, request.user_description]):
        raise HTTPException(status_code=400, detail="Provide at least one of: logs, stack_trace, code_snippet, user_description")

    graph = get_debug_graph()

    initial_state = {
        "session_id": request.session_id or str(uuid.uuid4()),
        "logs": request.logs,
        "stack_trace": request.stack_trace,
        "code_snippet": request.code_snippet,
        "services": [s.model_dump() for s in (request.services or [])],
        "user_description": request.user_description,
        "language": request.language or "python",
        "analysis_steps": [],
        "parsed_errors": [],
        "similar_issues": [],
        "classified_severity": "medium",
        "affected_services": [],
        "root_causes": [],
        "suggested_fixes": [],
        "summary": "",
        "raw_thinking": None,
        "error": None,
    }

    try:
        final_state = await graph.ainvoke(initial_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # Map to response model
    root_causes = [
        RootCause(**{k: v for k, v in rc.items() if k in RootCause.model_fields})
        for rc in final_state.get("root_causes", [])
    ]
    fixes = [
        Fix(**{k: v for k, v in f.items() if k in Fix.model_fields})
        for f in final_state.get("suggested_fixes", [])
    ]
    similar = [
        SimilarIssue(
            title=s.get("title", ""),
            description=s.get("description", ""),
            similarity_score=s.get("similarity_score", 0.0),
            resolution=s.get("resolution")
        )
        for s in final_state.get("similar_issues", [])
    ]

    severity_val = final_state.get("classified_severity", "medium")
    try:
        severity = Severity(severity_val)
    except ValueError:
        severity = Severity.MEDIUM

    return DebugResponse(
        session_id=final_state["session_id"],
        summary=final_state.get("summary", "Analysis complete."),
        severity=severity,
        root_causes=root_causes,
        fixes=fixes,
        similar_issues=similar,
        affected_services=final_state.get("affected_services", []),
        analysis_steps=final_state.get("analysis_steps", []),
        raw_thinking=final_state.get("raw_thinking"),
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Conversational debugging chat - follow-up questions about the analysis.
    Maintains session context.
    """
    reply, suggestions = await run_chat_agent(
        message=request.message,
        history=[(m.role, m.content) for m in request.history],
        session_id=request.session_id
    )
    return ChatResponse(
        session_id=request.session_id,
        reply=reply,
        suggestions=suggestions
    )


@router.post("/ingest")
async def ingest_issue(request: IngestRequest):
    """Store a resolved bug/issue into the Qdrant knowledge base."""
    point_id = await store_issue(
        title=request.title,
        description=request.description,
        resolution=request.resolution,
        tags=request.tags,
        language=request.language
    )
    return {"status": "stored", "id": point_id}


@router.get("/search")
async def search_knowledge(q: str, limit: int = 5):
    """Search the knowledge base for similar issues."""
    results = await search_similar(q, limit=limit)
    return {"results": results, "query": q}


@router.get("/examples")
async def get_examples():
    """Return example debug inputs for the frontend demo."""
    return {
        "examples": [
            {
                "title": "Python asyncio crash",
                "language": "python",
                "stack_trace": """Traceback (most recent call last):
  File "/app/services/data_processor.py", line 47, in process_batch
    results = await asyncio.gather(*tasks)
  File "/app/services/db_client.py", line 23, in fetch_records
    conn = await self.pool.acquire()
  File "/usr/lib/python3.11/asyncio/queues.py", line 162, in get
    await getter
asyncio.exceptions.CancelledError
RuntimeError: Event loop is closed""",
                "logs": """2024-01-15 14:23:01 INFO  [data-processor] Starting batch job batch_id=abc123
2024-01-15 14:23:01 INFO  [data-processor] Fetching 500 records from postgres
2024-01-15 14:23:04 ERROR [data-processor] Connection pool exhausted after 3s
2024-01-15 14:23:04 ERROR [data-processor] RuntimeError: Event loop is closed
2024-01-15 14:23:04 FATAL [data-processor] Batch job failed, 0/500 records processed""",
                "services": [{"name": "data-processor", "language": "python"}, {"name": "postgres", "language": "sql"}]
            },
            {
                "title": "Java NullPointerException in Spring Boot",
                "language": "java",
                "stack_trace": """java.lang.NullPointerException: Cannot invoke "com.example.UserService.findById(Long)" because "this.userService" is null
	at com.example.controllers.OrderController.createOrder(OrderController.java:45)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:897)
Caused by: org.springframework.beans.factory.NoSuchBeanDefinitionException: No qualifying bean of type 'com.example.UserService'""",
                "logs": "2024-01-15 10:00:01 ERROR [order-service] NullPointerException in createOrder\n2024-01-15 10:00:01 ERROR [order-service] Bean 'userService' not found in context",
                "services": [{"name": "order-service", "language": "java"}, {"name": "user-service", "language": "java"}]
            }
        ]
    }
