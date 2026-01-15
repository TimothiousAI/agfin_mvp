#!/bin/bash
# Server initialization script for Docker environment

# Kill any existing processes on ports 3001, 5173, and 8000
lsof -ti:3001 | xargs -r kill -9 2>/dev/null
lsof -ti:5173 | xargs -r kill -9 2>/dev/null
lsof -ti:8000 | xargs -r kill -9 2>/dev/null

# Wait for ports to be released
sleep 1

# Start frontend if it exists
if [ -d "client" ] && [ -f "client/package.json" ]; then
  echo "Starting frontend server..."
  cd client && npm run dev > ../web.log 2>&1 &
  cd ..
fi

# Start backend if it exists (checking for src/index.ts structure)
if [ -d "server" ] && [ -f "server/src/index.ts" ]; then
  echo "Starting backend server (TypeScript)..."
  cd server && npm run dev > ../server.log 2>&1 &
  cd ..
elif [ -d "server" ] && [ -f "server/index.js" ]; then
  echo "Starting backend server..."
  cd server && node index.js > ../server.log 2>&1 &
  cd ..
fi

# Start AI service if it exists
if [ -d "ai-service" ] && [ -f "ai-service/src/main.py" ]; then
  echo "Starting AI service..."
  cd ai-service && python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload > ../ai-service.log 2>&1 &
  cd ..
fi

echo "Servers starting in background..."
