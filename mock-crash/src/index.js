const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')

const GameEngine = require('./services/GameEngine')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 3000

// Initialize game engine
const gameEngine = new GameEngine(io)

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline styles for demo
}))
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// API Routes
app.get('/api/game/status', (req, res) => {
  res.json({
    isActive: gameEngine.isGameActive(),
    currentMultiplier: gameEngine.getCurrentMultiplier(),
    timeRemaining: gameEngine.getTimeRemaining(),
    lastResult: gameEngine.getLastResult(),
    totalRounds: gameEngine.getTotalRounds()
  })
})

app.post('/api/game/start', (req, res) => {
  try {
    gameEngine.startNewRound()
    res.json({ success: true, message: 'New round started' })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/game/bet', (req, res) => {
  try {
    const { amount, multiplier } = req.body
    const result = gameEngine.placeBet(amount, multiplier)
    res.json({ success: true, result })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.get('/api/game/history', (req, res) => {
  const { limit = 10 } = req.query
  res.json({
    history: gameEngine.getGameHistory(parseInt(limit))
  })
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  // Send current game state to new connection
  socket.emit('game_state', {
    isActive: gameEngine.isGameActive(),
    currentMultiplier: gameEngine.getCurrentMultiplier(),
    timeRemaining: gameEngine.getTimeRemaining(),
    lastResult: gameEngine.getLastResult()
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock crash site running on port ${PORT}`)
  console.log(`Access at: http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Process terminated')
  })
})

module.exports = { app, server, io }
