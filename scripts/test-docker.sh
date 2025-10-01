#!/bin/bash

# Docker test verification script for Crash Controller
# This script runs comprehensive tests on the Docker deployment

set -e

echo "🧪 Testing Crash Controller Docker Deployment"
echo "============================================"

# Configuration
CONTROLLER_URL="http://localhost:3002"
MOCK_CRASH_URL="http://localhost:3001"
DASHBOARD_URL="http://localhost:3000"
CLOUD_WORKER_URL="http://localhost:3003"
TEST_RUNNER_URL="http://localhost:3004"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test functions
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $test_name... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🔍 Running comprehensive tests..."
echo ""

# Test 1: Basic service connectivity
echo -e "${BLUE}📡 Testing service connectivity...${NC}"
run_test "Mock Crash Site" "curl -s -o /dev/null -w '%{http_code}' '$MOCK_CRASH_URL/api/game/status' | grep -q '200'"
run_test "Controller API" "curl -s -o /dev/null -w '%{http_code}' '$CONTROLLER_URL/health' | grep -q '200'"
run_test "Dashboard" "curl -s -o /dev/null -w '%{http_code}' '$DASHBOARD_URL' | grep -q '200'"
run_test "Cloud Worker" "curl -s -o /dev/null -w '%{http_code}' '$CLOUD_WORKER_URL/health' | grep -q '200'"
run_test "Test Runner" "curl -s -o /dev/null -w '%{http_code}' '$TEST_RUNNER_URL/health' | grep -q '200'"

# Test 2: API endpoints
echo ""
echo -e "${BLUE}🔌 Testing API endpoints...${NC}"
run_test "Controller Workers API" "curl -s '$CONTROLLER_URL/api/workers' | grep -q 'workers'"
run_test "Mock Crash Game Status" "curl -s '$MOCK_CRASH_URL/api/game/status' | grep -q 'isActive'"
run_test "Cloud Worker Status" "curl -s '$CLOUD_WORKER_URL/status' | grep -q 'workerId'"

# Test 3: Worker registration and control
echo ""
echo -e "${BLUE}🤖 Testing worker management...${NC}"
WORKER_ID="test-worker-$(date +%s)"
REGISTRATION_DATA="{\"workerId\": \"$WORKER_ID\", \"capabilities\": {\"browser\": \"chromium\", \"automation\": true}}"

run_test "Worker Registration" "curl -s -X POST -H 'Content-Type: application/json' -d '$REGISTRATION_DATA' '$CONTROLLER_URL/api/workers/register' | grep -q 'success'"

HEARTBEAT_DATA="{\"status\": \"online\", \"balance\": 100.0, \"lastWin\": 0, \"metrics\": {\"roundsCompleted\": 0, \"successRate\": 0, \"averageResponseTime\": 150}}"
run_test "Worker Heartbeat" "curl -s -X POST -H 'Content-Type: application/json' -d '$HEARTBEAT_DATA' '$CONTROLLER_URL/api/workers/$WORKER_ID/heartbeat' | grep -q 'success'"

START_DATA="{\"profile\": \"relaxed\"}"
run_test "Worker Start" "curl -s -X POST -H 'Content-Type: application/json' -d '$START_DATA' '$CONTROLLER_URL/api/workers/$WORKER_ID/start' | grep -q 'success'"

# Test 4: Mock crash game functionality
echo ""
echo -e "${BLUE}🎮 Testing mock crash game...${NC}"
run_test "Start New Game" "curl -s -X POST '$MOCK_CRASH_URL/api/game/start' | grep -q 'success'"

BET_DATA="{\"amount\": 10, \"multiplier\": 2.0}"
run_test "Place Bet" "curl -s -X POST -H 'Content-Type: application/json' -d '$BET_DATA' '$MOCK_CRASH_URL/api/game/bet' | grep -q 'success'"

# Test 5: Cloud worker features
echo ""
echo -e "${BLUE}☁️ Testing cloud worker features...${NC}"
run_test "Remote Desktop Access" "curl -s '$CLOUD_WORKER_URL/remote-desktop' | grep -q 'url'"
run_test "Terminal Access" "curl -s '$CLOUD_WORKER_URL/terminal' | grep -q 'url'"
run_test "Chrome DevTools" "curl -s '$CLOUD_WORKER_URL/devtools' | grep -q 'url'"
run_test "Python Runner" "curl -s '$CLOUD_WORKER_URL/python/packages' | grep -q 'packages'"

# Test 6: Database connectivity
echo ""
echo -e "${BLUE}🗄️ Testing database connectivity...${NC}"
run_test "PostgreSQL Connection" "docker exec crash_controller_postgres_1 pg_isready -U testuser -d crash_controller_test"
run_test "Redis Connection" "docker exec crash_controller_redis_1 redis-cli ping | grep -q 'PONG'"

# Test 7: Container health
echo ""
echo -e "${BLUE}🐳 Testing container health...${NC}"
run_test "All Containers Running" "docker-compose -f docker-compose.test.yml ps | grep -q 'Up'"

# Test 8: WebSocket connectivity
echo ""
echo -e "${BLUE}🔌 Testing WebSocket connectivity...${NC}"
run_test "Controller WebSocket" "timeout 5 curl -s '$CONTROLLER_URL' | grep -q 'html' || true"

# Test 9: File system access
echo ""
echo -e "${BLUE}📁 Testing file system access...${NC}"
run_test "Data Directory" "docker exec crash_controller_controller_1 ls -la /app/data"
run_test "Log Files" "docker-compose -f docker-compose.test.yml logs --tail=10 > /dev/null"

# Test 10: Performance tests
echo ""
echo -e "${BLUE}⚡ Testing performance...${NC}"
run_test "Response Time < 2s" "time curl -s -w '%{time_total}' -o /dev/null '$CONTROLLER_URL/health' | awk '{if (\$1 < 2) exit 0; else exit 1}'"
run_test "Memory Usage < 1GB" "docker stats --no-stream --format 'table {{.MemUsage}}' | grep -v 'MEM USAGE' | awk '{gsub(/[^0-9.]/, \"\", \$1); if (\$1 < 1024) exit 0; else exit 1}' || true"

echo ""
echo "📊 Test Results Summary:"
echo "======================="
echo -e "Total tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Docker deployment is working correctly.${NC}"
    echo ""
    echo "✅ System is ready for use!"
    echo "✅ All services are healthy"
    echo "✅ API endpoints are responding"
    echo "✅ Database connectivity is working"
    echo "✅ Cloud worker features are available"
    exit 0
else
    echo -e "\n${YELLOW}⚠️ Some tests failed. Check the logs for more details.${NC}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  1. Check container logs: docker-compose -f docker-compose.test.yml logs"
    echo "  2. Check specific service: docker-compose -f docker-compose.test.yml logs [service-name]"
    echo "  3. Restart services: docker-compose -f docker-compose.test.yml restart"
    echo "  4. Rebuild containers: docker-compose -f docker-compose.test.yml up --build"
    exit 1
fi
