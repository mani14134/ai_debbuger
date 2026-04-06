"""
DebugAI - AI-Powered Root Cause Analysis Platform
Main FastAPI Application Entry Point
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.routes import router
from api.websocket import ws_router
from vectorstore.qdrant_store import initialize_qdrant

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup."""
    print("🚀 DebugAI starting up...")
    await initialize_qdrant()
    print("✅ Qdrant vector store ready")
    yield
    print("👋 DebugAI shutting down...")

app = FastAPI(
    title="DebugAI - Root Cause Analysis Platform",
    description="AI-powered debugging across microservices using LangGraph + Groq + Qdrant",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(ws_router, prefix="/ws")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "DebugAI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
