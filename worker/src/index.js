const express = require('express')
const puppeteer = require('puppeteer')
const axios = require('axios')
const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')

const BrowserWorker = require('./services/BrowserWorker')
const MovementProfiles = require('./services/MovementProfiles')

const app = express()
const PORT = process.env.WORKER_API_PORT || 3001

// Configuration
const WORKER_ID = process.env.WORKER_ID || `worker-${uuidv4()}`
const CONTROLLER_URL = process.env.CONTROLLER_URL || 'http://controller:3000'
const MOCK_CRASH_URL = process.env.MOCK_CRASH_URL || 'http://mock-crash:3000'

// Initialize worker
const browserWorker = new BrowserWorker(WORKER_ID, MOCK_CRASH_URL)
const movementProfiles = new MovementProfiles()

// Middleware
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    workerId: WORKER_ID,
    browserStatus: browserWorker.isRunning() ? 'running' : 'stopped',
    timestamp: new Date().toISOString()
  })
})

// Worker status
app.get('/status', (req, res) => {
  res.json({
    workerId: WORKER_ID,
    status: browserWorker.getStatus(),
    balance: browserWorker.getBalance(),
    lastWin: browserWorker.getLastWin(),
    uptime: browserWorker.getUptime(),
    totalRounds: browserWorker.getTotalRounds(),
    successRate: browserWorker.getSuccessRate(),
    currentProfile: browserWorker.getCurrentProfile()
  })
})

// Start worker
app.post('/start', async (req, res) => {
  try {
    const { profile = 'relaxed' } = req.body
    await browserWorker.start(profile)
    res.json({ success: true, message: 'Worker started' })
  } catch (error) {
    console.error('Failed to start worker:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Stop worker
app.post('/stop', async (req, res) => {
  try {
    await browserWorker.stop()
    res.json({ success: true, message: 'Worker stopped' })
  } catch (error) {
    console.error('Failed to stop worker:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Set movement profile
app.post('/profile', async (req, res) => {
  try {
    const { profile } = req.body
    browserWorker.setProfile(profile)
    res.json({ success: true, message: `Profile set to ${profile}` })
  } catch (error) {
    console.error('Failed to set profile:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Controller communication
class ControllerClient {
  constructor(controllerUrl, workerId) {
    this.controllerUrl = controllerUrl
    this.workerId = workerId
    this.ws = null
    this.heartbeatInterval = null
    this.reconnectInterval = null
  }

  async connect() {
    try {
      // Register with controller
      await this.register()
      
      // Start WebSocket connection
      this.connectWebSocket()
      
      // Start heartbeat
      this.startHeartbeat()
      
      console.log(`Connected to controller: ${this.controllerUrl}`)
    } catch (error) {
      console.error('Failed to connect to controller:', error)
      this.scheduleReconnect()
    }
  }

  async register() {
    try {
      const response = await axios.post(`${this.controllerUrl}/api/workers/register`, {
        workerId: this.workerId,
        capabilities: {
          browser: 'chromium',
          automation: true,
          profiles: ['relaxed', 'normal', 'fast', 'aggressive']
        }
      })
      
      if (response.data.success) {
        console.log('Successfully registered with controller')
      }
    } catch (error) {
      console.error('Failed to register with controller:', error)
      throw error
    }
  }

  connectWebSocket() {
    const wsUrl = this.controllerUrl.replace('http', 'ws')
    this.ws = new WebSocket(`${wsUrl}/socket.io/?EIO=4&transport=websocket`)
    
    this.ws.on('open', () => {
      console.log('WebSocket connected to controller')
      this.scheduleReconnect = null // Clear reconnect schedule
    })
    
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        this.handleControllerMessage(message)
      } catch (error) {
        console.error('Failed to parse controller message:', error)
      }
    })
    
    this.ws.on('close', () => {
      console.log('WebSocket disconnected from controller')
      this.scheduleReconnect()
    })
    
    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      this.scheduleReconnect()
    })
  }

  handleControllerMessage(message) {
    if (message.type === 'command') {
      this.handleCommand(message.command)
    }
  }

  async handleCommand(command) {
    try {
      switch (command.type) {
        case 'start':
          await browserWorker.start(command.profile)
          break
        case 'stop':
          await browserWorker.stop()
          break
        case 'set_profile':
          browserWorker.setProfile(command.profile)
          break
        default:
          console.log('Unknown command type:', command.type)
      }
    } catch (error) {
      console.error('Failed to handle command:', error)
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendHeartbeat()
      } catch (error) {
        console.error('Failed to send heartbeat:', error)
      }
    }, 30000) // 30 seconds
  }

  async sendHeartbeat() {
    try {
      const status = browserWorker.getStatus()
      const balance = browserWorker.getBalance()
      const lastWin = browserWorker.getLastWin()
      const metrics = browserWorker.getMetrics()
      
      await axios.post(`${this.controllerUrl}/api/workers/${this.workerId}/heartbeat`, {
        status,
        balance,
        lastWin,
        metrics
      })
    } catch (error) {
      console.error('Failed to send heartbeat:', error)
    }
  }

  scheduleReconnect() {
    if (this.reconnectInterval) return
    
    this.reconnectInterval = setTimeout(() => {
      console.log('Attempting to reconnect to controller...')
      this.reconnectInterval = null
      this.connect()
    }, 5000) // 5 seconds
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval)
      this.reconnectInterval = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Initialize controller client
const controllerClient = new ControllerClient(CONTROLLER_URL, WORKER_ID)

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Worker ${WORKER_ID} running on port ${PORT}`)
  console.log(`Controller URL: ${CONTROLLER_URL}`)
  console.log(`Mock crash URL: ${MOCK_CRASH_URL}`)
  
  // Connect to controller
  await controllerClient.connect()
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  
  controllerClient.disconnect()
  await browserWorker.stop()
  
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  
  controllerClient.disconnect()
  await browserWorker.stop()
  
  process.exit(0)
})

module.exports = { app, browserWorker, controllerClient }
