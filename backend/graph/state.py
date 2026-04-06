"""
LangGraph State Schema for the Debug Analysis Pipeline
"""
from typing import TypedDict, List, Optional, Annotated
import operator


class DebugState(TypedDict):
    """State shared across all nodes in the debug graph."""

    # Input fields
    session_id: str
    logs: Optional[str]
    stack_trace: Optional[str]
    code_snippet: Optional[str]
    services: List[dict]
    user_description: Optional[str]
    language: str

    # Analysis pipeline outputs (accumulated via operator.add)
    analysis_steps: Annotated[List[str], operator.add]

    # Intermediate results
    parsed_errors: List[dict]       # Structured errors from logs/traces
    similar_issues: List[dict]      # Retrieved from Qdrant
    classified_severity: str        # low/medium/high/critical
    affected_services: List[str]    # Identified microservices

    # Final outputs
    root_causes: List[dict]
    suggested_fixes: List[dict]
    summary: str
    raw_thinking: Optional[str]

    # Control flow
    error: Optional[str]
