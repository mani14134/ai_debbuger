"""
WebSocket endpoint for real-time streaming of analysis progress.
"""
import json
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from graph.pipeline import get_debug_graph

ws_router = APIRouter()


@ws_router.websocket("/analyze")
async def analyze_stream(websocket: WebSocket):
    """
    Stream analysis progress updates to the frontend in real-time.
    Each LangGraph step sends a progress event.
    """
    await websocket.accept()

    try:
        data = await websocket.receive_text()
        payload = json.loads(data)

        session_id = payload.get("session_id", str(uuid.uuid4()))
        graph = get_debug_graph()

        initial_state = {
            "session_id": session_id,
            "logs": payload.get("logs"),
            "stack_trace": payload.get("stack_trace"),
            "code_snippet": payload.get("code_snippet"),
            "services": payload.get("services", []),
            "user_description": payload.get("user_description"),
            "language": payload.get("language", "python"),
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

        await websocket.send_json({"type": "start", "message": "🔍 Analysis pipeline started..."})

        # Stream node updates
        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event.get("event")

            if kind == "on_chain_start":
                node = event.get("name", "")
                node_labels = {
                    "parse_errors": "📋 Parsing logs and stack traces...",
                    "retrieve_similar": "🔎 Searching knowledge base for similar issues...",
                    "classify": "🏷️ Classifying severity and affected services...",
                    "root_cause": "🎯 Performing root cause analysis...",
                    "fix_suggest": "🔧 Generating fix suggestions...",
                    "summarize": "📝 Writing executive summary...",
                }
                if node in node_labels:
                    await websocket.send_json({
                        "type": "progress",
                        "node": node,
                        "message": node_labels[node]
                    })

        # Run again to get final state (astream_events doesn't return final state easily)
        final_state = await graph.ainvoke(initial_state)

        await websocket.send_json({
            "type": "complete",
            "result": {
                "session_id": final_state["session_id"],
                "summary": final_state.get("summary", ""),
                "severity": final_state.get("classified_severity", "medium"),
                "root_causes": final_state.get("root_causes", []),
                "fixes": final_state.get("suggested_fixes", []),
                "similar_issues": final_state.get("similar_issues", []),
                "affected_services": final_state.get("affected_services", []),
                "analysis_steps": final_state.get("analysis_steps", []),
            }
        })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
