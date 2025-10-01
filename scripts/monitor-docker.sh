#!/bin/bash

# Docker monitoring script for Crash Controller
# This script provides real-time monitoring of the Docker deployment

set -e

echo "📊 Crash Controller Docker Monitoring"
echo "==================================="

# Configuration
CONTROLLER_URL="http://localhost:3002"
MOCK_CRASH_URL="http://localhost:3001"
DASHBOARD_URL="http://localhost:3000"
CLOUD_WORKER_URL="http://localhost:3003"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to check service status
check_service() {
    local name="$1"
    local url="$2"
    local timeout="${3:-5}"
    
    if timeout $timeout curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name${NC}"
        return 0
    else
        echo -e "${RED}❌ $name${NC}"
        return 1
    fi
}

# Function to get service info
get_service_info() {
    local name="$1"
    local url="$2"
    
    echo -e "\n${CYAN}📋 $name Information:${NC}"
    if curl -s "$url" > /dev/null 2>&1; then
        curl -s "$url" | jq . 2>/dev/null || echo "Response received but not JSON"
    else
        echo "Service not responding"
    fi
}

# Function to show container stats
show_container_stats() {
    echo -e "\n${CYAN}🐳 Container Statistics:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to show container logs
show_recent_logs() {
    local service="$1"
    local lines="${2:-10}"
    
    echo -e "\n${CYAN}📝 Recent logs for $service:${NC}"
    docker-compose -f docker-compose.test.yml logs --tail=$lines $service 2>/dev/null || echo "No logs available"
}

# Main monitoring loop
monitor_loop() {
    while true; do
        clear
        echo -e "${BLUE}📊 Crash Controller Docker Monitoring${NC}"
        echo "=================================="
        echo "Last updated: $(date)"
        echo ""
        
        # Service status
        echo -e "${CYAN}🔍 Service Status:${NC}"
        check_service "Dashboard" "$DASHBOARD_URL"
        check_service "Controller API" "$CONTROLLER_URL/health"
        check_service "Mock Crash Site" "$MOCK_CRASH_URL/api/game/status"
        check_service "Cloud Worker" "$CLOUD_WORKER_URL/health"
        
        # Container status
        echo -e "\n${CYAN}🐳 Container Status:${NC}"
        docker-compose -f docker-compose.test.yml ps
        
        # Resource usage
        show_container_stats
        
        # Recent logs
        echo -e "\n${CYAN}📝 Recent Logs:${NC}"
        echo "Press Ctrl+C to exit monitoring"
        
        sleep 5
    done
}

# Interactive menu
show_menu() {
    echo ""
    echo "📊 Monitoring Options:"
    echo "1. Real-time monitoring (auto-refresh)"
    echo "2. Service status check"
    echo "3. Container statistics"
    echo "4. View logs"
    echo "5. Service information"
    echo "6. Restart services"
    echo "7. Stop all services"
    echo "8. Exit"
    echo ""
    read -p "Select option (1-8): " choice
    
    case $choice in
        1)
            monitor_loop
            ;;
        2)
            echo -e "\n${CYAN}🔍 Service Status Check:${NC}"
            check_service "Dashboard" "$DASHBOARD_URL"
            check_service "Controller API" "$CONTROLLER_URL/health"
            check_service "Mock Crash Site" "$MOCK_CRASH_URL/api/game/status"
            check_service "Cloud Worker" "$CLOUD_WORKER_URL/health"
            ;;
        3)
            show_container_stats
            ;;
        4)
            echo ""
            echo "Available services:"
            docker-compose -f docker-compose.test.yml ps --services
            echo ""
            read -p "Enter service name: " service
            show_recent_logs "$service"
            ;;
        5)
            echo ""
            echo "Available services:"
            echo "1. Controller API"
            echo "2. Mock Crash Site"
            echo "3. Cloud Worker"
            echo ""
            read -p "Select service (1-3): " service_choice
            
            case $service_choice in
                1) get_service_info "Controller API" "$CONTROLLER_URL/health" ;;
                2) get_service_info "Mock Crash Site" "$MOCK_CRASH_URL/api/game/status" ;;
                3) get_service_info "Cloud Worker" "$CLOUD_WORKER_URL/health" ;;
                *) echo "Invalid option" ;;
            esac
            ;;
        6)
            echo "Restarting services..."
            docker-compose -f docker-compose.test.yml restart
            echo "Services restarted"
            ;;
        7)
            echo "Stopping all services..."
            docker-compose -f docker-compose.test.yml down
            echo "All services stopped"
            exit 0
            ;;
        8)
            echo "Exiting monitoring..."
            exit 0
            ;;
        *)
            echo "Invalid option"
            ;;
    esac
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️ jq is not installed. Some features may not work properly."
    echo "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
fi

# Main execution
if [ "$1" = "--loop" ]; then
    monitor_loop
else
    while true; do
        show_menu
    done
fi
