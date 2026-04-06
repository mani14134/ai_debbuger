"""
Conversational Chat Agent for follow-up debugging questions.
Uses LangChain with Groq LLM and conversation history.
"""
import os
from typing import List, Tuple
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = """You are DebugAI, an expert debugging assistant specialized in:
- Root cause analysis of application errors
- Microservices debugging and distributed systems
- Code review and bug identification
- Performance optimization
- Security vulnerability assessment

You have deep knowledge of Python, Java, JavaScript, Go, Rust, Kubernetes, Docker, databases, and cloud infrastructure.

When answering:
1. Be precise and technical
2. Provide code examples when helpful
3. Suggest tools for diagnosis (e.g., py-spy, jstack, kubectl, etc.)
4. Consider the full system context, not just individual components
5. Mention related issues that could arise

Keep responses focused and actionable. If asked for suggestions, provide 2-3 follow-up questions the user might want to ask."""


async def run_chat_agent(
    message: str,
    history: List[Tuple[str, str]],
    session_id: str
) -> Tuple[str, List[str]]:
    """
    Run the chat agent with conversation history.
    Returns (reply, follow_up_suggestions)
    """
    llm = ChatGroq(
        model=GROQ_MODEL,
        temperature=0.5,
        api_key=os.getenv("GROQ_API_KEY")
    )

    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    # Add conversation history
    for role, content in history[-10:]:  # Keep last 10 turns
        if role == "user":
            messages.append(HumanMessage(content=content))
        else:
            messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=message))

    response = await llm.ainvoke(messages)
    reply = response.content

    # Generate contextual follow-up suggestions
    suggestion_prompt = f"""Based on this debugging conversation, suggest 3 short follow-up questions the developer might want to ask next.

User asked: {message}
Assistant replied: {reply[:500]}

Return as JSON array of 3 short question strings. Return ONLY the JSON array."""

    import json, re
    suggestion_response = await llm.ainvoke([
        SystemMessage(content="You generate helpful follow-up debugging questions."),
        HumanMessage(content=suggestion_prompt)
    ])

    raw = suggestion_response.content.strip()
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()

    try:
        suggestions = json.loads(raw)
        if not isinstance(suggestions, list):
            suggestions = []
        suggestions = [s for s in suggestions if isinstance(s, str)][:3]
    except Exception:
        suggestions = [
            "What are the performance implications?",
            "How do I prevent this in the future?",
            "Are there related issues I should check?"
        ]

    return reply, suggestions
