const { spawn } = require('child_process')
const path = require('path')

class RemoteDesktopService {
  constructor() {
    this.isRunning = false
    this.port = 3389
    this.vncPort = 5900
    this.process = null
  }

  async start() {
    if (this.isRunning) {
      console.log('Remote desktop is already running')
      return
    }

    try {
      console.log('Starting remote desktop service...')
      
      // Start XRDP service
      this.process = spawn('service', ['xrdp', 'start'], {
        stdio: 'inherit',
        shell: true
      })

      this.isRunning = true
      console.log('Remote desktop service started')
    } catch (error) {
      console.error('Failed to start remote desktop:', error)
      throw error
    }
  }

  async stop() {
    if (!this.isRunning) {
      return
    }

    try {
      if (this.process) {
        this.process.kill()
        this.process = null
      }

      this.isRunning = false
      console.log('Remote desktop service stopped')
    } catch (error) {
      console.error('Failed to stop remote desktop:', error)
    }
  }

  getAccessUrl() {
    const hostname = process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost'
    return `rdp://${hostname}:${this.port}`
  }

  getTerminalUrl() {
    const hostname = process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost'
    return `ssh://playwright@${hostname}:22`
  }

  getVncUrl() {
    const hostname = process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost'
    return `vnc://${hostname}:${this.vncPort}`
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      vncPort: this.vncPort,
      accessUrl: this.getAccessUrl(),
      terminalUrl: this.getTerminalUrl(),
      vncUrl: this.getVncUrl()
    }
  }
}

module.exports = RemoteDesktopService
