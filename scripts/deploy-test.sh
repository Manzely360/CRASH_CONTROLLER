#!/bin/bash

# Docker test deployment script for Crash Controller
# This script deploys the entire system in test mode using Docker

set -e

echo "🐳 Deploying Crash Controller in Docker Test Mode"
echo "==============================================="

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

# Clean up any existing containers
echo ""
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true

# Create data directory for SQLite
mkdir -p data

echo ""
echo "🔧 Building and starting services..."
echo "This may take a few minutes on first run..."

# Build and start all services
docker-compose -f docker-compose.test.yml up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo "This may take 2-3 minutes for all services to start..."

# Wait for services to be ready
sleep 30

# Check if services are running
echo ""
echo "🔍 Checking service status..."

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "Checking $name... "
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ Ready"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ Failed to start"
    return 1
}

# Check each service
check_service "PostgreSQL" "http://localhost:5432" || true
check_service "Redis" "http://localhost:6379" || true
check_service "Mock Crash Site" "http://localhost:3001/api/game/status"
check_service "Controller API" "http://localhost:3002/health"
check_service "Dashboard" "http://localhost:3000"
check_service "Cloud Worker" "http://localhost:3003/health"

echo ""
echo "🎉 Docker test deployment completed!"
echo ""
echo "📱 Access the services:"
echo "   Dashboard:    http://localhost:3000"
echo "   Mock Site:    http://localhost:3001"
echo "   Controller:   http://localhost:3002"
echo "   Cloud Worker: http://localhost:3003"
echo "   Test Runner:  http://localhost:3004"
echo ""
echo "🔧 Management commands:"
echo "   View logs:    docker-compose -f docker-compose.test.yml logs -f"
echo "   Stop all:     docker-compose -f docker-compose.test.yml down"
echo "   Restart:      docker-compose -f docker-compose.test.yml restart"
echo "   Scale workers: docker-compose -f docker-compose.test.yml up --scale worker-1=3 --scale worker-2=3"
echo ""
echo "🧪 Test the system:"
echo "   Run tests:    curl http://localhost:3004/results"
echo "   Health check: curl http://localhost:3004/health"
echo ""
echo "⚠️  Remember: This is for educational purposes only!"
echo "   All interactions target the local mock site."
echo "   No real gambling or external accounts are used."

# Show running containers
echo ""
echo "📦 Running containers:"
docker-compose -f docker-compose.test.yml ps
