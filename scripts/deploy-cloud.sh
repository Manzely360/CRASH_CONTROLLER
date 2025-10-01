#!/bin/bash

# Cloud deployment script for Crash Controller
# This script deploys the system to Vercel + Railway

set -e

echo "🚀 Deploying Crash Controller to Cloud"
echo "====================================="

# Check if required tools are installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "   npm i -g vercel"
    exit 1
fi

if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "   npm i -g @railway/cli"
    exit 1
fi

echo "✅ Required tools are installed"

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway:"
    railway login
fi

echo "✅ Authentication verified"

# Deploy dashboard to Vercel
echo ""
echo "📱 Deploying dashboard to Vercel..."
cd dashboard
vercel --prod
cd ..

# Deploy controller to Railway
echo ""
echo "🔧 Deploying controller to Railway..."
cd controller
railway up --detach
cd ..

# Deploy cloud workers to Railway
echo ""
echo "☁️ Deploying cloud workers to Railway..."
cd worker-cloud
railway up --detach
cd ..

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📱 Access your services:"
echo "   Dashboard:    https://your-app.vercel.app"
echo "   Controller:   https://your-controller.railway.app"
echo "   Cloud Workers: https://your-workers.railway.app"
echo ""
echo "🔧 Next steps:"
echo "   1. Set up environment variables in Vercel and Railway"
echo "   2. Configure Google OAuth credentials"
echo "   3. Set up PostgreSQL database"
echo "   4. Test the deployment"
echo ""
echo "⚠️  Remember: This is for educational purposes only!"
