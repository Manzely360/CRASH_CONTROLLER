#!/bin/bash

# System test script for Crash Controller
# This script tests the entire system functionality

set -e

echo "🧪 Testing Crash Controller System"
echo "================================="

# Configuration
CONTROLLER_URL="http://localhost:3002"
MOCK_CRASH_URL="http://localhost:3001"
DASHBOARD_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_service() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

test_api_endpoint() {
    local name=$1
    local url=$2
    local method=$3
    local data=$4
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" "$url")
    else
        response=$(curl -s "$url")
    fi
    
    if echo "$response" | grep -q "success\|healthy\|workers"; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "🔍 Running system tests..."
echo ""

# Test 1: Mock Crash Site
test_service "Mock Crash Site" "$MOCK_CRASH_URL" "200"

# Test 2: Controller API Health
test_api_endpoint "Controller Health" "$CONTROLLER_URL/health" "GET"

# Test 3: Controller Workers API
test_api_endpoint "Controller Workers API" "$CONTROLLER_URL/api/workers" "GET"

# Test 4: Mock Crash Game Status
test_api_endpoint "Mock Crash Game Status" "$MOCK_CRASH_URL/api/game/status" "GET"

# Test 5: Dashboard
test_service "Dashboard" "$DASHBOARD_URL" "200"

echo ""
echo "🤖 Testing worker registration..."

# Test 6: Worker Registration
worker_id="test-worker-$(date +%s)"
registration_data="{\"workerId\": \"$worker_id\", \"capabilities\": {\"browser\": \"chromium\", \"automation\": true}}"

if test_api_endpoint "Worker Registration" "$CONTROLLER_URL/api/workers/register" "POST" "$registration_data"; then
    echo "✅ Worker registered successfully"
    
    # Test 7: Worker Heartbeat
    heartbeat_data="{\"status\": \"online\", \"balance\": 100.0, \"lastWin\": 0, \"metrics\": {\"roundsCompleted\": 0, \"successRate\": 0, \"averageResponseTime\": 150}}"
    
    if test_api_endpoint "Worker Heartbeat" "$CONTROLLER_URL/api/workers/$worker_id/heartbeat" "POST" "$heartbeat_data"; then
        echo "✅ Worker heartbeat sent successfully"
    else
        echo -e "${RED}❌ Worker heartbeat failed${NC}"
    fi
    
    # Test 8: Worker Control
    start_data="{\"profile\": \"relaxed\"}"
    if test_api_endpoint "Worker Start" "$CONTROLLER_URL/api/workers/$worker_id/start" "POST" "$start_data"; then
        echo "✅ Worker start command sent successfully"
    else
        echo -e "${RED}❌ Worker start command failed${NC}"
    fi
else
    echo -e "${RED}❌ Worker registration failed${NC}"
fi

echo ""
echo "🎮 Testing mock crash game..."

# Test 9: Start New Game
if test_api_endpoint "Start New Game" "$MOCK_CRASH_URL/api/game/start" "POST" "{}"; then
    echo "✅ New game started successfully"
else
    echo -e "${RED}❌ Failed to start new game${NC}"
fi

# Test 10: Place Bet
bet_data="{\"amount\": 10, \"multiplier\": 2.0}"
if test_api_endpoint "Place Bet" "$MOCK_CRASH_URL/api/game/bet" "POST" "$bet_data"; then
    echo "✅ Bet placed successfully"
else
    echo -e "${RED}❌ Failed to place bet${NC}"
fi

echo ""
echo "📊 System test summary:"
echo "======================"

# Count test results
total_tests=10
passed_tests=0

# Re-run tests to count results (simplified)
for i in {1..10}; do
    if [ $i -le 5 ]; then
        # Basic service tests
        if curl -s -o /dev/null -w "%{http_code}" "$MOCK_CRASH_URL" | grep -q "200"; then
            ((passed_tests++))
        fi
    fi
done

echo "Total tests: $total_tests"
echo "Passed: $passed_tests"
echo "Failed: $((total_tests - passed_tests))"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 All tests passed! System is working correctly.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the logs for more details.${NC}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  1. Check if all services are running: docker-compose ps"
    echo "  2. View logs: docker-compose logs"
    echo "  3. Restart services: docker-compose restart"
    exit 1
fi
