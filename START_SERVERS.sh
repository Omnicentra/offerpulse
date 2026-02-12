#!/bin/bash

# OfferPulse - Start Development Servers

echo "🚀 Starting OfferPulse development servers..."
echo ""

# Kill any existing servers
echo "Clearing existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

# Start marketing app
echo "📱 Starting marketing app (port 3000)..."
cd apps/marketing
pnpm dev > /tmp/marketing-dev.log 2>&1 &
MARKETING_PID=$!
echo "Marketing app PID: $MARKETING_PID"

# Start dashboard app
echo "📊 Starting dashboard app (port 3001)..."
cd ../app
pnpm dev > /tmp/app-dev.log 2>&1 &
APP_PID=$!
echo "Dashboard app PID: $APP_PID"

echo ""
echo "✅ Servers starting..."
echo ""
echo "📱 Marketing: http://localhost:3000"
echo "📊 Dashboard: http://localhost:3001"
echo ""
echo "Logs:"
echo "  Marketing: tail -f /tmp/marketing-dev.log"
echo "  Dashboard: tail -f /tmp/app-dev.log"
echo ""
echo "To stop: kill $MARKETING_PID $APP_PID"
