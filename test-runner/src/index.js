const express = require('express')
const axios = require('axios')
const WebSocket = require('ws')

const app = express()
const PORT = process.env.PORT || 3000

// Configuration
const CONTROLLER_URL = process.env.CONTROLLER_URL || 'http://controller:3000'
const MOCK_CRASH_URL = process.env.MOCK_CRASH_URL || 'http://mock-crash:3000'
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://dashboard:3000'

// Test results
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
}

// Test functions
async function testService(name, url, expectedStatus = 200) {
  try {
    const response = await axios.get(url, { timeout: 10000 })
    const success = response.status === expectedStatus
    addTestResult(name, success, `Status: ${response.status}`)
    return success
  } catch (error) {
    addTestResult(name, false, `Error: ${error.message}`)
    return false
  }
}

async function testApiEndpoint(name, url, method = 'GET', data = null) {
  try {
    let response
    if (method === 'POST') {
      response = await axios.post(url, data, { timeout: 10000 })
    } else {
      response = await axios.get(url, { timeout: 10000 })
    }
    
    const success = response.data && (response.data.success || response.data.status)
    addTestResult(name, success, `Response: ${JSON.stringify(response.data).substring(0, 100)}...`)
    return success
  } catch (error) {
    addTestResult(name, false, `Error: ${error.message}`)
    return false
  }
}

function addTestResult(name, passed, message) {
  testResults.total++
  if (passed) {
    testResults.passed++
  } else {
    testResults.failed++
  }
  
  testResults.tests.push({
    name,
    passed,
    message,
    timestamp: new Date().toISOString()
  })
  
  console.log(`${passed ? '✅' : '❌'} ${name}: ${message}`)
}

async function runAllTests() {
  console.log('🧪 Starting Crash Controller Test Suite')
  console.log('=====================================')
  
  // Wait for services to be ready
  console.log('⏳ Waiting for services to be ready...')
  await new Promise(resolve => setTimeout(resolve, 30000))
  
  console.log('\n🔍 Running service tests...')
  
  // Test 1: Mock Crash Site
  await testService('Mock Crash Site', `${MOCK_CRASH_URL}/api/game/status`)
  
  // Test 2: Controller API Health
  await testService('Controller Health', `${CONTROLLER_URL}/health`)
  
  // Test 3: Controller Workers API
  await testApiEndpoint('Controller Workers API', `${CONTROLLER_URL}/api/workers`)
  
  // Test 4: Mock Crash Game Status
  await testApiEndpoint('Mock Crash Game Status', `${MOCK_CRASH_URL}/api/game/status`)
  
  // Test 5: Dashboard
  await testService('Dashboard', DASHBOARD_URL)
  
  console.log('\n🤖 Testing worker registration...')
  
  // Test 6: Worker Registration
  const workerId = `test-worker-${Date.now()}`
  const registrationData = {
    workerId,
    capabilities: {
      browser: 'chromium',
      automation: true,
      profiles: ['relaxed', 'normal', 'fast', 'aggressive']
    }
  }
  
  await testApiEndpoint('Worker Registration', `${CONTROLLER_URL}/api/workers/register`, 'POST', registrationData)
  
  // Test 7: Worker Heartbeat
  const heartbeatData = {
    status: 'online',
    balance: 100.0,
    lastWin: 0,
    metrics: {
      roundsCompleted: 0,
      successRate: 0,
      averageResponseTime: 150
    }
  }
  
  await testApiEndpoint('Worker Heartbeat', `${CONTROLLER_URL}/api/workers/${workerId}/heartbeat`, 'POST', heartbeatData)
  
  // Test 8: Worker Control
  const startData = { profile: 'relaxed' }
  await testApiEndpoint('Worker Start', `${CONTROLLER_URL}/api/workers/${workerId}/start`, 'POST', startData)
  
  console.log('\n🎮 Testing mock crash game...')
  
  // Test 9: Start New Game
  await testApiEndpoint('Start New Game', `${MOCK_CRASH_URL}/api/game/start`, 'POST', {})
  
  // Test 10: Place Bet
  const betData = { amount: 10, multiplier: 2.0 }
  await testApiEndpoint('Place Bet', `${MOCK_CRASH_URL}/api/game/bet`, 'POST', betData)
  
  console.log('\n☁️ Testing cloud worker...')
  
  // Test 11: Cloud Worker Health
  await testService('Cloud Worker Health', 'http://cloud-worker-1:3001/health')
  
  // Test 12: Cloud Worker Status
  await testApiEndpoint('Cloud Worker Status', 'http://cloud-worker-1:3001/status')
  
  console.log('\n📊 Test Results Summary:')
  console.log('======================')
  console.log(`Total tests: ${testResults.total}`)
  console.log(`Passed: ${testResults.passed}`)
  console.log(`Failed: ${testResults.failed}`)
  console.log(`Success rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`)
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! System is working correctly.')
    process.exit(0)
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs for more details.')
    process.exit(1)
  }
}

// API endpoints for test results
app.get('/results', (req, res) => {
  res.json(testResults)
})

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    tests: testResults
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test runner listening on port ${PORT}`)
  
  // Start tests after a short delay
  setTimeout(runAllTests, 5000)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})
