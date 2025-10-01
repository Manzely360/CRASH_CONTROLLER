#!/bin/bash

# Development stop script for Crash Controller
# This script stops all services and cleans up

set -e

echo "🛑 Stopping Crash Controller Development Environment"
echo "=================================================="

# Stop all services
echo "Stopping Docker containers..."
docker-compose down

echo ""
echo "🧹 Cleaning up..."

# Remove unused containers and images (optional)
read -p "Remove unused Docker containers and images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing unused containers and images..."
    docker system prune -f
fi

echo ""
echo "✅ Development environment stopped successfully!"
echo ""
echo "💡 To start again, run:"
echo "   ./scripts/start-dev.sh"
echo ""
echo "🗑️  To completely clean up (remove all data):"
echo "   docker-compose down -v"
echo "   docker system prune -a -f"
