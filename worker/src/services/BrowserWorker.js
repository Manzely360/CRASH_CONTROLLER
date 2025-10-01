const puppeteer = require('puppeteer')
const MovementProfiles = require('./MovementProfiles')

class BrowserWorker {
  constructor(workerId, mockCrashUrl) {
    this.workerId = workerId
    this.mockCrashUrl = mockCrashUrl
    this.browser = null
    this.context = null
    this.page = null
    this.isRunning = false
    this.status = 'offline'
    this.balance = 100.00
    this.lastWin = 0
    this.startTime = null
    this.totalRounds = 0
    this.successfulRounds = 0
    this.currentProfile = 'relaxed'
    this.movementProfiles = new MovementProfiles()
    this.workerInterval = null
  }

  async start(profile = 'relaxed') {
    if (this.isRunning) {
      console.log('Worker is already running')
      return
    }

    try {
      console.log(`Starting worker ${this.workerId} with profile: ${profile}`)
      
      this.status = 'deploying'
      this.currentProfile = profile
      this.startTime = Date.now()
      
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      })

      // Create page
      this.page = await this.browser.newPage()
      
      // Set viewport
      await this.page.setViewport({ width: 1280, height: 720 })
      
      // Set user agent
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      
      // Navigate to mock crash site
      await this.page.goto(this.mockCrashUrl, { waitUntil: 'networkidle' })
      
      this.status = 'online'
      this.isRunning = true
      
      // Start worker loop
      this.startWorkerLoop()
      
      console.log(`Worker ${this.workerId} started successfully`)
    } catch (error) {
      console.error(`Failed to start worker ${this.workerId}:`, error)
      this.status = 'error'
      await this.cleanup()
      throw error
    }
  }

  async stop() {
    if (!this.isRunning) {
      console.log('Worker is not running')
      return
    }

    try {
      console.log(`Stopping worker ${this.workerId}`)
      
      this.status = 'offline'
      this.isRunning = false
      
      // Stop worker loop
      if (this.workerInterval) {
        clearInterval(this.workerInterval)
        this.workerInterval = null
      }
      
      // Cleanup browser resources
      await this.cleanup()
      
      console.log(`Worker ${this.workerId} stopped successfully`)
    } catch (error) {
      console.error(`Failed to stop worker ${this.workerId}:`, error)
      throw error
    }
  }

  async cleanup() {
    try {
      if (this.page) {
        await this.page.close()
        this.page = null
      }
      
      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  startWorkerLoop() {
    this.workerInterval = setInterval(async () => {
      if (!this.isRunning || !this.page) return
      
      try {
        await this.performWorkerAction()
      } catch (error) {
        console.error(`Worker ${this.workerId} action failed:`, error)
      }
    }, this.movementProfiles.getInterval(this.currentProfile))
  }

  async performWorkerAction() {
    try {
      // Simulate checking the crash game state
      const gameState = await this.checkGameState()
      
      if (gameState.isActive) {
        // Game is running, wait for it to finish
        await this.waitForGameEnd()
      } else {
        // Game is not active, simulate placing a bet
        await this.placeBet()
      }
      
      this.totalRounds++
      
      // Simulate occasional wins
      if (Math.random() < 0.3) { // 30% win rate
        const winAmount = Math.random() * 50 + 10 // $10-$60
        this.balance += winAmount
        this.lastWin = winAmount
        this.successfulRounds++
        
        console.log(`Worker ${this.workerId} won $${winAmount.toFixed(2)}`)
      } else {
        // Simulate bet loss
        const betAmount = Math.random() * 20 + 5 // $5-$25
        this.balance = Math.max(0, this.balance - betAmount)
        this.lastWin = 0
      }
      
    } catch (error) {
      console.error(`Worker action failed:`, error)
    }
  }

  async checkGameState() {
    try {
      // Check if game is currently running
      const isActive = await this.page.evaluate(() => {
        const gameElement = document.querySelector('.game-active')
        return gameElement !== null
      })
      
      return { isActive }
    } catch (error) {
      console.error('Failed to check game state:', error)
      return { isActive: false }
    }
  }

  async waitForGameEnd() {
    try {
      // Wait for game to end with timeout
      await this.page.waitForFunction(
        () => {
          const gameElement = document.querySelector('.game-active')
          return gameElement === null
        },
        { timeout: 10000 }
      )
    } catch (error) {
      console.error('Timeout waiting for game to end:', error)
    }
  }

  async placeBet() {
    try {
      const profile = this.movementProfiles.getProfile(this.currentProfile)
      
      // Simulate human-like interaction delays
      await this.randomDelay(profile.clickDelay.min, profile.clickDelay.max)
      
      // Click bet button if available
      const betButton = await this.page.$('.bet-button')
      if (betButton) {
        await betButton.click()
        await this.randomDelay(profile.clickDelay.min, profile.clickDelay.max)
      }
      
      // Simulate mouse movement
      await this.simulateMouseMovement()
      
    } catch (error) {
      console.error('Failed to place bet:', error)
    }
  }

  async simulateMouseMovement() {
    try {
      const profile = this.movementProfiles.getProfile(this.currentProfile)
      
      // Get viewport size
      const viewport = this.page.viewportSize()
      
      // Generate random coordinates
      const x = Math.random() * (viewport.width - 100) + 50
      const y = Math.random() * (viewport.height - 100) + 50
      
      // Move mouse with human-like timing
      await this.page.mouse.move(x, y, { steps: profile.mouseSteps })
      await this.randomDelay(profile.mouseDelay.min, profile.mouseDelay.max)
      
    } catch (error) {
      console.error('Failed to simulate mouse movement:', error)
    }
  }

  async randomDelay(min, max) {
    const delay = Math.random() * (max - min) + min
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  setProfile(profile) {
    this.currentProfile = profile
    console.log(`Worker ${this.workerId} profile changed to: ${profile}`)
  }

  // Getters
  getStatus() {
    return this.status
  }

  getBalance() {
    return this.balance
  }

  getLastWin() {
    return this.lastWin
  }

  getUptime() {
    if (!this.startTime) return 0
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  getTotalRounds() {
    return this.totalRounds
  }

  getSuccessRate() {
    if (this.totalRounds === 0) return 0
    return this.successfulRounds / this.totalRounds
  }

  getCurrentProfile() {
    return this.currentProfile
  }

  getMetrics() {
    return {
      roundsCompleted: this.totalRounds,
      successRate: this.getSuccessRate(),
      averageResponseTime: 150 + Math.random() * 100 // Simulated response time
    }
  }

  isRunning() {
    return this.isRunning
  }
}

module.exports = BrowserWorker
