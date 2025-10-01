const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')

const WorkerManager = require('./services/WorkerManager')
const TelemetryService = require('./services/TelemetryService')
const workerRoutes = require('./routes/workers')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.DASHBOARD_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 3000
const MOCK_CRASH_URL = process.env.MOCK_CRASH_URL || 'http://localhost:3001'

// Initialize services
const workerManager = new WorkerManager(io)
const telemetryService = new TelemetryService()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/workers', workerRoutes(workerManager, telemetryService))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    workers: workerManager.getWorkerCount(),
    mockCrashUrl: MOCK_CRASH_URL
  })
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Dashboard connected:', socket.id)
  
  // Send current workers state to new connection
  socket.emit('workers_update', {
    type: 'workers_update',
    workers: workerManager.getAllWorkers()
  })
  
  socket.on('disconnect', () => {
    console.log('Dashboard disconnected:', socket.id)
  })
})

// Worker registration endpoint
app.post('/api/workers/register', (req, res) => {
  const { workerId, capabilities } = req.body
  
  try {
    const worker = workerManager.registerWorker(workerId, capabilities)
    console.log(`Worker registered: ${workerId}`)
    
    // Notify all dashboard clients
    io.emit('workers_update', {
      type: 'workers_update',
      workers: workerManager.getAllWorkers()
    })
    
    res.json({ success: true, worker })
  } catch (error) {
    console.error('Worker registration failed:', error)
    res.status(400).json({ success: false, error: error.message })
  }
})

// Worker heartbeat endpoint
app.post('/api/workers/:workerId/heartbeat', (req, res) => {
  const { workerId } = req.params
  const { status, balance, lastWin, metrics } = req.body
  
  try {
    workerManager.updateWorkerStatus(workerId, {
      status,
      balance,
      lastWin,
      metrics,
      lastActivity: Date.now()
    })
    
    // Store telemetry
    telemetryService.recordHeartbeat(workerId, {
      status,
      balance,
      lastWin,
      metrics,
      timestamp: Date.now()
    })
    
    // Notify dashboard clients
    io.emit('workers_update', {
      type: 'workers_update',
      workers: workerManager.getAllWorkers()
    })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Heartbeat update failed:', error)
    res.status(400).json({ success: false, error: error.message })
  }
})

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Controller API running on port ${PORT}`)
  console.log(`Mock crash site: ${MOCK_CRASH_URL}`)
  console.log(`Dashboard URL: ${process.env.DASHBOARD_URL || 'http://localhost:3000'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Process terminated')
  })
})

module.exports = { app, server, io }
