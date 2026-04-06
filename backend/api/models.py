"""
Data models for DebugAI platform
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ServiceInfo(BaseModel):
    name: str
    language: Optional[str] = None
    version: Optional[str] = None


class DebugRequest(BaseModel):
    session_id: str = Field(default="default")
    logs: Optional[str] = Field(default=None, description="Raw log output")
    stack_trace: Optional[str] = Field(default=None, description="Stack trace or error")
    code_snippet: Optional[str] = Field(default=None, description="Relevant code context")
    services: Optional[List[ServiceInfo]] = Field(default=[], description="Microservices involved")
    user_description: Optional[str] = Field(default=None, description="User description of the issue")
    language: Optional[str] = Field(default="python", description="Primary language")


class RootCause(BaseModel):
    title: str
    description: str
    confidence: float
    location: Optional[str] = None
    service: Optional[str] = None


class Fix(BaseModel):
    title: str
    description: str
    code_before: Optional[str] = None
    code_after: Optional[str] = None
    priority: int = 1


class SimilarIssue(BaseModel):
    title: str
    description: str
    similarity_score: float
    resolution: Optional[str] = None


class DebugResponse(BaseModel):
    session_id: str
    summary: str
    severity: Severity
    root_causes: List[RootCause]
    fixes: List[Fix]
    similar_issues: List[SimilarIssue]
    affected_services: List[str]
    analysis_steps: List[str]
    raw_thinking: Optional[str] = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    suggestions: List[str] = []


class IngestRequest(BaseModel):
    title: str
    description: str
    resolution: str
    tags: List[str] = []
    language: Optional[str] = None
