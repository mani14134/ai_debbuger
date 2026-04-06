"""
LangGraph Pipeline - Orchestrates the debug analysis workflow.

Flow:
  START
    │
    ▼
parse_errors ──► retrieve_similar ──► classify ──► root_cause ──► fix_suggest ──► summarize
                                                                                      │
                                                                                    END
"""
from langgraph.graph import StateGraph, START, END
from graph.state import DebugState
from graph.nodes import (
    parse_errors_node,
    retrieve_similar_node,
    classify_node,
    root_cause_node,
    fix_suggestion_node,
    summarize_node,
)


def build_debug_graph():
    """Build and compile the LangGraph debug analysis pipeline."""
    graph = StateGraph(DebugState)

    # Register nodes
    graph.add_node("parse_errors", parse_errors_node)
    graph.add_node("retrieve_similar", retrieve_similar_node)
    graph.add_node("classify", classify_node)
    graph.add_node("root_cause", root_cause_node)
    graph.add_node("fix_suggest", fix_suggestion_node)
    graph.add_node("summarize", summarize_node)

    # Define linear pipeline edges
    graph.add_edge(START, "parse_errors")
    graph.add_edge("parse_errors", "retrieve_similar")
    graph.add_edge("retrieve_similar", "classify")
    graph.add_edge("classify", "root_cause")
    graph.add_edge("root_cause", "fix_suggest")
    graph.add_edge("fix_suggest", "summarize")
    graph.add_edge("summarize", END)

    return graph.compile()


# Singleton graph instance
_graph = None


def get_debug_graph():
    global _graph
    if _graph is None:
        _graph = build_debug_graph()
    return _graph
