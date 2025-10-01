const express = require('express')
const puppeteer = require('puppeteer')
const axios = require('axios')
const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')
const { PythonShell } = require('python-shell')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const BrowserWorker = require('./services/BrowserWorker')
const RemoteDesktopService = require('./services/RemoteDesktopService')
const PythonRunner = require('./services/PythonRunner')
const DevToolsService = require('./services/DevToolsService')

const app = express()
const PORT = process.env.PORT || 3001

// Configuration
const WORKER_ID = process.env.WORKER_ID || `cloud-worker-${uuidv4()}`
const CONTROLLER_URL = process.env.CONTROLLER_URL || 'http://controller:3000'
const MOCK_CRASH_URL = process.env.MOCK_CRASH_URL || 'http://mock-crash:3000'
const CLOUD_REGION = process.env.CLOUD_REGION || 'us-east-1'

// Initialize services
const browserWorker = new BrowserWorker(WORKER_ID, MOCK_CRASH_URL)
const remoteDesktop = new RemoteDesktopService()
const pythonRunner = new PythonRunner()
const devTools = new DevToolsService()

// Middleware
app.use(express.json())
app.use(express.static('public'))

// File upload configuration
const upload = multer({ dest: 'uploads/' })

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    workerId: WORKER_ID,
    cloudRegion: CLOUD_REGION,
    browserStatus: browserWorker.isRunning() ? 'running' : 'stopped',
    remoteDesktop: remoteDesktop.isRunning(),
    pythonRunner: pythonRunner.isRunning(),
    devTools: devTools.isRunning(),
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
    currentProfile: browserWorker.getCurrentProfile(),
    cloudRegion: CLOUD_REGION,
    remoteAccess: {
      desktop: remoteDesktop.getAccessUrl(),
      terminal: remoteDesktop.getTerminalUrl(),
      devTools: devTools.getAccessUrl()
    }
  })
})

// Remote desktop access
app.get('/remote-desktop', (req, res) => {
  res.json({
    url: remoteDesktop.getAccessUrl(),
    username: 'playwright',
    password: 'playwright',
    port: 3389
  })
})

// Terminal access
app.get('/terminal', (req, res) => {
  res.json({
    url: remoteDesktop.getTerminalUrl(),
    command: 'tmux new-session -d -s main'
  })
})

// Chrome DevTools access
app.get('/devtools', (req, res) => {
  res.json({
    url: devTools.getAccessUrl(),
    browser: 'chromium',
    version: '120.0.0.0'
  })
})

// Python script execution
app.post('/python/run', upload.single('script'), async (req, res) => {
  try {
    const { script } = req.body
    const result = await pythonRunner.executeScript(script)
    res.json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Python script upload and run
app.post('/python/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const scriptPath = req.file.path
    const result = await pythonRunner.executeFile(scriptPath)
    
    // Clean up uploaded file
    fs.unlinkSync(scriptPath)
    
    res.json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get Python packages
app.get('/python/packages', (req, res) => {
  res.json({
    packages: pythonRunner.getInstalledPackages(),
    version: pythonRunner.getPythonVersion()
  })
})

// Install Python package
app.post('/python/install', async (req, res) => {
  try {
    const { package: packageName } = req.body
    const result = await pythonRunner.installPackage(packageName)
    res.json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Browser automation endpoints
app.post('/browser/start', async (req, res) => {
  try {
    const { profile = 'relaxed', targetUrl } = req.body
    await browserWorker.start(profile, targetUrl)
    res.json({ success: true, message: 'Browser started' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/browser/stop', async (req, res) => {
  try {
    await browserWorker.stop()
    res.json({ success: true, message: 'Browser stopped' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/browser/screenshot', async (req, res) => {
  try {
    const screenshot = await browserWorker.takeScreenshot()
    res.json({ success: true, screenshot })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// File management
app.get('/files', (req, res) => {
  try {
    const files = fs.readdirSync('/app/data')
    res.json({ success: true, files })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params
    const filePath = path.join('/app/data', filename)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' })
    }
    
    res.download(filePath)
  } catch (error) {
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
      
      console.log(`Cloud worker connected to controller: ${this.controllerUrl}`)
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
          profiles: ['relaxed', 'normal', 'fast', 'aggressive'],
          cloud: true,
          remoteDesktop: true,
          pythonRunner: true,
          devTools: true
        },
        cloudRegion: CLOUD_REGION
      })
      
      if (response.data.success) {
        console.log('Successfully registered cloud worker with controller')
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
      this.scheduleReconnect = null
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
          await browserWorker.start(command.profile, command.targetUrl)
          break
        case 'stop':
          await browserWorker.stop()
          break
        case 'set_profile':
          browserWorker.setProfile(command.profile)
          break
        case 'remote_desktop':
          await remoteDesktop.start()
          break
        case 'python_run':
          await pythonRunner.executeScript(command.script)
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
    }, 30000)
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
        metrics,
        cloudRegion: CLOUD_REGION,
        remoteAccess: {
          desktop: remoteDesktop.getAccessUrl(),
          terminal: remoteDesktop.getTerminalUrl(),
          devTools: devTools.getAccessUrl()
        }
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
    }, 5000)
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
  console.log(`Cloud worker ${WORKER_ID} running on port ${PORT}`)
  console.log(`Controller URL: ${CONTROLLER_URL}`)
  console.log(`Mock crash URL: ${MOCK_CRASH_URL}`)
  console.log(`Cloud region: ${CLOUD_REGION}`)
  
  // Start services
  await remoteDesktop.start()
  await devTools.start()
  
  // Connect to controller
  await controllerClient.connect()
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  
  controllerClient.disconnect()
  await browserWorker.stop()
  await remoteDesktop.stop()
  await devTools.stop()
  
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  
  controllerClient.disconnect()
  await browserWorker.stop()
  await remoteDesktop.stop()
  await devTools.stop()
  
  process.exit(0)
})

module.exports = { app, browserWorker, controllerClient }
