#!/bin/bash

# Development startup script for Crash Controller
# This script starts all services in development mode

set -e

echo "🚀 Starting Crash Controller Development Environment"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

echo "✅ Docker is running"
echo "✅ docker-compose is available"

# Create data directory for SQLite
mkdir -p data

echo ""
echo "🔧 Building and starting services..."
echo "This may take a few minutes on first run..."

# Start all services
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for services to be ready
sleep 10

# Check if services are running
echo ""
echo "🔍 Checking service status..."

# Check mock crash site
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Mock crash site is running at http://localhost:3001"
else
    echo "❌ Mock crash site is not responding"
fi

# Check controller API
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Controller API is running at http://localhost:3002"
else
    echo "❌ Controller API is not responding"
fi

# Check dashboard
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Dashboard is running at http://localhost:3000"
else
    echo "❌ Dashboard is not responding"
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📱 Access the services:"
echo "   Dashboard:    http://localhost:3000"
echo "   Mock Site:    http://localhost:3001"
echo "   Controller:   http://localhost:3002"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
echo "⚠️  Remember: This is for educational purposes only!"
echo "   All interactions target the local mock site."
echo "   No real gambling or external accounts are used."
