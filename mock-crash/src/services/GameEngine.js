class GameEngine {
  constructor(io) {
    this.io = io
    this.isGameActive = false
    this.currentMultiplier = 1.00
    this.gameStartTime = null
    this.gameDuration = 10000 // 10 seconds
    this.lastResult = null
    this.totalRounds = 0
    this.gameHistory = []
    this.gameInterval = null
    this.crashPoint = null
  }

  startNewRound() {
    if (this.isGameActive) {
      throw new Error('Game is already active')
    }

    console.log('Starting new crash game round')
    
    this.isGameActive = true
    this.currentMultiplier = 1.00
    this.gameStartTime = Date.now()
    this.crashPoint = this.generateCrashPoint()
    
    // Notify all connected clients
    this.io.emit('game_started', {
      crashPoint: this.crashPoint,
      startTime: this.gameStartTime
    })
    
    // Start game loop
    this.startGameLoop()
    
    this.totalRounds++
  }

  generateCrashPoint() {
    // Generate crash point with realistic distribution
    // Higher multipliers are less likely
    const random = Math.random()
    
    if (random < 0.1) {
      // 10% chance of very high multiplier (2.0+)
      return 2.0 + Math.random() * 3.0
    } else if (random < 0.3) {
      // 20% chance of high multiplier (1.5-2.0)
      return 1.5 + Math.random() * 0.5
    } else if (random < 0.6) {
      // 30% chance of medium multiplier (1.2-1.5)
      return 1.2 + Math.random() * 0.3
    } else {
      // 40% chance of low multiplier (1.0-1.2)
      return 1.0 + Math.random() * 0.2
    }
  }

  startGameLoop() {
    this.gameInterval = setInterval(() => {
      if (!this.isGameActive) return
      
      const elapsed = Date.now() - this.gameStartTime
      const progress = elapsed / this.gameDuration
      
      if (progress >= 1.0) {
        // Game ended
        this.endGame()
      } else {
        // Update multiplier
        this.updateMultiplier(progress)
      }
    }, 100) // Update every 100ms
  }

  updateMultiplier(progress) {
    // Simulate realistic crash curve
    const baseMultiplier = 1.0 + (progress * 0.5) // Linear growth
    const volatility = Math.sin(progress * Math.PI) * 0.1 // Sine wave volatility
    const noise = (Math.random() - 0.5) * 0.05 // Random noise
    
    this.currentMultiplier = Math.max(1.0, baseMultiplier + volatility + noise)
    
    // Notify clients of multiplier update
    this.io.emit('multiplier_update', {
      multiplier: this.currentMultiplier,
      progress: progress,
      timeRemaining: this.gameDuration - (Date.now() - this.gameStartTime)
    })
  }

  endGame() {
    console.log(`Game ended at ${this.currentMultiplier.toFixed(2)}x (crashed at ${this.crashPoint.toFixed(2)}x)`)
    
    this.isGameActive = false
    this.lastResult = {
      multiplier: this.currentMultiplier,
      crashed: this.currentMultiplier >= this.crashPoint,
      crashPoint: this.crashPoint,
      timestamp: Date.now()
    }
    
    // Add to history
    this.gameHistory.unshift(this.lastResult)
    if (this.gameHistory.length > 100) {
      this.gameHistory = this.gameHistory.slice(0, 100)
    }
    
    // Clear interval
    if (this.gameInterval) {
      clearInterval(this.gameInterval)
      this.gameInterval = null
    }
    
    // Notify clients
    this.io.emit('game_ended', this.lastResult)
    
    // Start next round after delay
    setTimeout(() => {
      this.startNewRound()
    }, 3000) // 3 second delay between rounds
  }

  placeBet(amount, targetMultiplier) {
    if (!this.isGameActive) {
      throw new Error('No active game')
    }
    
    if (amount <= 0) {
      throw new Error('Invalid bet amount')
    }
    
    if (targetMultiplier < 1.0) {
      throw new Error('Invalid target multiplier')
    }
    
    // Simulate bet placement
    const bet = {
      id: Date.now().toString(),
      amount: amount,
      targetMultiplier: targetMultiplier,
      timestamp: Date.now(),
      status: 'placed'
    }
    
    console.log(`Bet placed: $${amount} at ${targetMultiplier}x`)
    
    // Notify clients
    this.io.emit('bet_placed', bet)
    
    return bet
  }

  // Getters
  isGameActive() {
    return this.isGameActive
  }

  getCurrentMultiplier() {
    return this.currentMultiplier
  }

  getTimeRemaining() {
    if (!this.isGameActive || !this.gameStartTime) return 0
    return Math.max(0, this.gameDuration - (Date.now() - this.gameStartTime))
  }

  getLastResult() {
    return this.lastResult
  }

  getTotalRounds() {
    return this.totalRounds
  }

  getGameHistory(limit = 10) {
    return this.gameHistory.slice(0, limit)
  }

  getCrashPoint() {
    return this.crashPoint
  }
}

module.exports = GameEngine
