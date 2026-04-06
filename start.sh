#!/usr/bin/env bash
# DebugAI startup script
set -e

echo "🔍 DebugAI — AI Root Cause Analysis Platform"
echo "============================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Install from https://python.org"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Created .env from example. Please edit backend/.env with your API keys."
    echo "   Required: GROQ_API_KEY, QDRANT_URL, QDRANT_API_KEY"
    exit 1
fi

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q
echo "✅ Backend dependencies installed"

# Start backend in background
echo "🚀 Starting FastAPI backend on http://localhost:8000 ..."
python main.py &
BACKEND_PID=$!

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    npm install
fi
echo "✅ Frontend dependencies installed"

echo "🚀 Starting React frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ DebugAI is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait and cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
