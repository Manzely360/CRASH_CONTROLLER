#!/bin/bash

# Railway deployment script for Crash Controller
# This script deploys the system to Railway for live experimental run

set -e

echo "🚀 Deploying Crash Controller to Railway (Live Experimental)"
echo "=========================================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "   npm i -g @railway/cli"
    echo "   or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo "✅ Railway CLI is available"

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway:"
    railway login
fi

echo "✅ Railway authentication verified"

# Create Railway project
echo ""
echo "📦 Creating Railway project..."
railway new crash-controller --template blank

# Deploy Controller API
echo ""
echo "🔧 Deploying Controller API..."
cd controller
railway up --detach
railway variables set NODE_ENV=production
railway variables set PORT=3000
cd ..

# Deploy Mock Crash Site
echo ""
echo "🎮 Deploying Mock Crash Site..."
cd mock-crash
railway up --detach
railway variables set NODE_ENV=production
railway variables set PORT=3000
cd ..

# Deploy Cloud Worker
echo ""
echo "☁️ Deploying Cloud Worker..."
cd worker-cloud
railway up --detach
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set CLOUD_REGION=us-east-1
cd ..

# Get deployment URLs
echo ""
echo "🔗 Getting deployment URLs..."
CONTROLLER_URL=$(railway status --json | jq -r '.services[] | select(.name=="controller") | .url' 2>/dev/null || echo "https://controller-production.up.railway.app")
MOCK_CRASH_URL=$(railway status --json | jq -r '.services[] | select(.name=="mock-crash") | .url' 2>/dev/null || echo "https://mock-crash-production.up.railway.app")
CLOUD_WORKER_URL=$(railway status --json | jq -r '.services[] | select(.name=="cloud-worker") | .url' 2>/dev/null || echo "https://cloud-worker-production.up.railway.app")

echo ""
echo "🎉 Railway deployment completed!"
echo ""
echo "📱 Access your live services:"
echo "   Controller API:   $CONTROLLER_URL"
echo "   Mock Crash Site:  $MOCK_CRASH_URL"
echo "   Cloud Worker:     $CLOUD_WORKER_URL"
echo ""
echo "🔧 Management commands:"
echo "   View logs:        railway logs"
echo "   Check status:     railway status"
echo "   Open dashboard:   railway open"
echo "   Scale service:    railway scale [service-name] [instances]"
echo ""
echo "⚠️  Remember: This is for experimental purposes only!"
echo "   All interactions target the mock site for safety."
echo "   No real gambling or external accounts are used."
echo ""
echo "🧪 Test the deployment:"
echo "   Health check:     curl $CONTROLLER_URL/health"
echo "   Mock game:        curl $MOCK_CRASH_URL/api/game/status"
echo "   Cloud worker:     curl $CLOUD_WORKER_URL/health"
