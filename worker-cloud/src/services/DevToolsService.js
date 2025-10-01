const puppeteer = require('puppeteer')
const { spawn } = require('child_process')

class DevToolsService {
  constructor() {
    this.isRunning = false
    this.port = 9222
    this.browser = null
    this.process = null
  }

  async start() {
    if (this.isRunning) {
      console.log('Chrome DevTools is already running')
      return
    }

    try {
      console.log('Starting Chrome DevTools service...')
      
      // Launch Chrome with remote debugging
      this.browser = await puppeteer.launch({
        headless: false,
        executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
        args: [
          '--remote-debugging-port=9222',
          '--remote-allow-origins=*',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      })

      this.isRunning = true
      console.log('Chrome DevTools service started')
    } catch (error) {
      console.error('Failed to start Chrome DevTools:', error)
      throw error
    }
  }

  async stop() {
    if (!this.isRunning) {
      return
    }

    try {
      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }

      this.isRunning = false
      console.log('Chrome DevTools service stopped')
    } catch (error) {
      console.error('Failed to stop Chrome DevTools:', error)
    }
  }

  getAccessUrl() {
    const hostname = process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost'
    return `http://${hostname}:${this.port}`
  }

  getDevToolsUrl() {
    const hostname = process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost'
    return `chrome-devtools://devtools/bundled/inspector.html?ws=${hostname}:${this.port}`
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      accessUrl: this.getAccessUrl(),
      devToolsUrl: this.getDevToolsUrl()
    }
  }
}

module.exports = DevToolsService
