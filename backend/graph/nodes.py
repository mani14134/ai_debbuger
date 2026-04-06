"""
LangGraph Nodes - Each node is a discrete analysis step in the debug pipeline.
Pipeline: parse → retrieve → classify → root_cause → fix_suggest → summarize
"""
import os
import json
import re
from typing import Any
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage

from graph.state import DebugState
from vectorstore.qdrant_store import search_similar

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def get_llm(temperature: float = 0.1) -> ChatGroq:
    return ChatGroq(
        model=GROQ_MODEL,
        temperature=temperature,
        api_key=os.getenv("GROQ_API_KEY")
    )


# ─────────────────────────────────────────────
# NODE 1: Parse Errors
# ─────────────────────────────────────────────
async def parse_errors_node(state: DebugState) -> dict:
    """Extract structured errors from raw logs and stack traces."""
    llm = get_llm()

    input_text = "\n".join(filter(None, [
        f"LOGS:\n{state.get('logs')}" if state.get('logs') else "",
        f"STACK TRACE:\n{state.get('stack_trace')}" if state.get('stack_trace') else "",
        f"CODE:\n{state.get('code_snippet')}" if state.get('code_snippet') else "",
        f"DESCRIPTION:\n{state.get('user_description')}" if state.get('user_description') else "",
    ]))

    prompt = f"""You are an expert debugger. Analyze this error information and extract structured errors.

{input_text}

Return a JSON array of errors with this schema:
[{{
  "error_type": "ExceptionType or error category",
  "message": "the error message",
  "file": "filename if visible",
  "line": "line number if visible",
  "service": "service name if identifiable",
  "language": "programming language"
}}]

Return ONLY valid JSON, no explanation."""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    raw = response.content.strip()

    # Clean JSON from markdown fences
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()

    try:
        parsed_errors = json.loads(raw)
    except Exception:
        parsed_errors = [{"error_type": "ParseError", "message": raw, "service": "unknown"}]

    return {
        "parsed_errors": parsed_errors,
        "analysis_steps": ["✅ Step 1: Parsed and structured error information from logs and stack traces"]
    }


# ─────────────────────────────────────────────
# NODE 2: Retrieve Similar Issues from Qdrant
# ─────────────────────────────────────────────
async def retrieve_similar_node(state: DebugState) -> dict:
    """Search Qdrant for similar historical bugs and their resolutions."""
    query_parts = []

    if state.get("parsed_errors"):
        for err in state["parsed_errors"][:2]:
            query_parts.append(f"{err.get('error_type','')} {err.get('message','')}")

    if state.get("user_description"):
        query_parts.append(state["user_description"])

    query = " ".join(query_parts) or "application error debug"
    similar = await search_similar(query, limit=3)

    return {
        "similar_issues": similar,
        "analysis_steps": [f"✅ Step 2: Retrieved {len(similar)} similar historical issues from knowledge base"]
    }


# ─────────────────────────────────────────────
# NODE 3: Classify Severity & Services
# ─────────────────────────────────────────────
async def classify_node(state: DebugState) -> dict:
    """Classify severity and identify affected microservices."""
    llm = get_llm()

    errors_str = json.dumps(state.get("parsed_errors", []), indent=2)
    services_str = json.dumps(state.get("services", []), indent=2)

    prompt = f"""Analyze these parsed errors and classify the incident.

ERRORS:
{errors_str}

KNOWN SERVICES:
{services_str}

Return JSON:
{{
  "severity": "low|medium|high|critical",
  "affected_services": ["service1", "service2"],
  "reasoning": "brief explanation"
}}

Severity guide:
- critical: data loss, complete outage, security breach
- high: major feature broken, significant user impact  
- medium: partial degradation, workaround exists
- low: minor issue, cosmetic, limited impact

Return ONLY valid JSON."""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    raw = response.content.strip()
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()

    try:
        result = json.loads(raw)
        severity = result.get("severity", "medium")
        affected_services = result.get("affected_services", [])
    except Exception:
        severity = "medium"
        affected_services = []

    return {
        "classified_severity": severity,
        "affected_services": affected_services,
        "analysis_steps": [f"✅ Step 3: Classified severity as '{severity.upper()}', identified {len(affected_services)} affected service(s)"]
    }


# ─────────────────────────────────────────────
# NODE 4: Root Cause Analysis
# ─────────────────────────────────────────────
async def root_cause_node(state: DebugState) -> dict:
    """Deep root cause analysis using all gathered context."""
    llm = get_llm(temperature=0.2)

    errors_str = json.dumps(state.get("parsed_errors", []), indent=2)
    similar_str = json.dumps(state.get("similar_issues", []), indent=2)
    services = state.get("affected_services", [])
    code = state.get("code_snippet", "")
    logs = state.get("logs", "")

    prompt = f"""You are a senior systems engineer performing root cause analysis.

PARSED ERRORS:
{errors_str}

AFFECTED SERVICES: {', '.join(services) or 'Unknown'}

SIMILAR HISTORICAL ISSUES:
{similar_str}

{f'CODE CONTEXT:{chr(10)}{code}' if code else ''}
{f'RAW LOGS (excerpt):{chr(10)}{logs[:2000]}' if logs else ''}

Perform deep root cause analysis. Consider:
1. The actual root cause (not just symptoms)
2. Chain of failure in microservices (cascading failures)
3. Contributing factors
4. Why this happened (not just what happened)

Return JSON array of root causes (most likely first):
[{{
  "title": "Concise root cause title",
  "description": "Detailed explanation of why this is the root cause",
  "confidence": 0.0-1.0,
  "location": "file:line or service:component",
  "service": "which service"
}}]

Return ONLY valid JSON."""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    raw = response.content.strip()
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()

    try:
        root_causes = json.loads(raw)
    except Exception:
        root_causes = [{
            "title": "Analysis Error",
            "description": raw,
            "confidence": 0.5,
            "location": "unknown",
            "service": "unknown"
        }]

    return {
        "root_causes": root_causes,
        "analysis_steps": [f"✅ Step 4: Identified {len(root_causes)} root cause(s) with confidence scoring"]
    }


# ─────────────────────────────────────────────
# NODE 5: Fix Suggestions
# ─────────────────────────────────────────────
async def fix_suggestion_node(state: DebugState) -> dict:
    """Generate actionable fix suggestions with code examples."""
    llm = get_llm(temperature=0.3)

    root_causes_str = json.dumps(state.get("root_causes", []), indent=2)
    similar_str = json.dumps(state.get("similar_issues", []), indent=2)
    language = state.get("language", "python")
    code = state.get("code_snippet", "")

    prompt = f"""You are a senior developer. Generate concrete fix suggestions for these root causes.

ROOT CAUSES:
{root_causes_str}

SIMILAR RESOLVED ISSUES:
{similar_str}

PRIMARY LANGUAGE: {language}
{f'EXISTING CODE:{chr(10)}{code}' if code else ''}

For each root cause, provide a fix. Return JSON array:
[{{
  "title": "Fix title",
  "description": "What to do and why",
  "code_before": "broken code snippet if applicable (null if not)",
  "code_after": "fixed code snippet if applicable (null if not)",
  "priority": 1-5 (1=most urgent)
}}]

Make code examples realistic and in {language}. Return ONLY valid JSON."""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    raw = response.content.strip()
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()

    try:
        fixes = json.loads(raw)
    except Exception:
        fixes = [{
            "title": "Manual Investigation Required",
            "description": raw,
            "code_before": None,
            "code_after": None,
            "priority": 1
        }]

    return {
        "suggested_fixes": fixes,
        "analysis_steps": [f"✅ Step 5: Generated {len(fixes)} actionable fix suggestion(s) with code examples"]
    }


# ─────────────────────────────────────────────
# NODE 6: Summarize
# ─────────────────────────────────────────────
async def summarize_node(state: DebugState) -> dict:
    """Generate executive summary of the entire analysis."""
    llm = get_llm(temperature=0.4)

    root_causes = state.get("root_causes", [])
    fixes = state.get("suggested_fixes", [])
    severity = state.get("classified_severity", "medium")
    services = state.get("affected_services", [])

    top_cause = root_causes[0]["title"] if root_causes else "Unknown"
    top_fix = fixes[0]["title"] if fixes else "Manual investigation"

    prompt = f"""Create a concise executive summary for this debugging session.

SEVERITY: {severity}
AFFECTED SERVICES: {', '.join(services) or 'Unknown'}
PRIMARY ROOT CAUSE: {top_cause}
RECOMMENDED FIX: {top_fix}
TOTAL ROOT CAUSES FOUND: {len(root_causes)}
TOTAL FIXES SUGGESTED: {len(fixes)}

Write a 2-3 sentence summary that:
1. States what broke and how severe it is
2. Identifies the root cause clearly
3. States the recommended action

Be direct and technical. No fluff."""

    response = await llm.ainvoke([HumanMessage(content=prompt)])

    return {
        "summary": response.content.strip(),
        "analysis_steps": ["✅ Step 6: Generated executive summary and completed analysis"]
    }
