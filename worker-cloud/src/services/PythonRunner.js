const { PythonShell } = require('python-shell')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

class PythonRunner {
  constructor() {
    this.isRunning = false
    this.port = 8080
    this.process = null
    this.installedPackages = []
    this.pythonVersion = null
  }

  async start() {
    if (this.isRunning) {
      console.log('Python runner is already running')
      return
    }

    try {
      console.log('Starting Python runner service...')
      
      // Get Python version
      this.pythonVersion = await this.getPythonVersion()
      
      // Get installed packages
      this.installedPackages = await this.getInstalledPackages()
      
      this.isRunning = true
      console.log('Python runner service started')
    } catch (error) {
      console.error('Failed to start Python runner:', error)
      throw error
    }
  }

  async stop() {
    if (!this.isRunning) {
      return
    }

    try {
      this.isRunning = false
      console.log('Python runner service stopped')
    } catch (error) {
      console.error('Failed to stop Python runner:', error)
    }
  }

  async executeScript(script) {
    try {
      return new Promise((resolve, reject) => {
        PythonShell.runString(script, {
          pythonPath: 'python3',
          pythonOptions: ['-u'],
          scriptPath: '/app/data'
        }, (err, results) => {
          if (err) {
            reject(err)
          } else {
            resolve({
              output: results,
              success: true
            })
          }
        })
      })
    } catch (error) {
      throw new Error(`Python execution failed: ${error.message}`)
    }
  }

  async executeFile(filePath) {
    try {
      return new Promise((resolve, reject) => {
        PythonShell.run(filePath, {
          pythonPath: 'python3',
          pythonOptions: ['-u'],
          scriptPath: '/app/data'
        }, (err, results) => {
          if (err) {
            reject(err)
          } else {
            resolve({
              output: results,
              success: true
            })
          }
        })
      })
    } catch (error) {
      throw new Error(`Python file execution failed: ${error.message}`)
    }
  }

  async installPackage(packageName) {
    try {
      return new Promise((resolve, reject) => {
        const pip = spawn('pip3', ['install', packageName], {
          stdio: 'pipe'
        })

        let output = ''
        let error = ''

        pip.stdout.on('data', (data) => {
          output += data.toString()
        })

        pip.stderr.on('data', (data) => {
          error += data.toString()
        })

        pip.on('close', (code) => {
          if (code === 0) {
            // Update installed packages list
            this.getInstalledPackages().then(packages => {
              this.installedPackages = packages
            })
            resolve({
              output,
              success: true
            })
          } else {
            reject(new Error(`Package installation failed: ${error}`))
          }
        })
      })
    } catch (error) {
      throw new Error(`Failed to install package: ${error.message}`)
    }
  }

  async getPythonVersion() {
    try {
      return new Promise((resolve, reject) => {
        const python = spawn('python3', ['--version'], {
          stdio: 'pipe'
        })

        let output = ''

        python.stdout.on('data', (data) => {
          output += data.toString()
        })

        python.on('close', (code) => {
          if (code === 0) {
            resolve(output.trim())
          } else {
            reject(new Error('Failed to get Python version'))
          }
        })
      })
    } catch (error) {
      return 'Unknown'
    }
  }

  async getInstalledPackages() {
    try {
      return new Promise((resolve, reject) => {
        const pip = spawn('pip3', ['list', '--format=json'], {
          stdio: 'pipe'
        })

        let output = ''

        pip.stdout.on('data', (data) => {
          output += data.toString()
        })

        pip.on('close', (code) => {
          if (code === 0) {
            try {
              const packages = JSON.parse(output)
              resolve(packages.map(pkg => pkg.name))
            } catch (parseError) {
              resolve([])
            }
          } else {
            resolve([])
          }
        })
      })
    } catch (error) {
      return []
    }
  }

  getInstalledPackages() {
    return this.installedPackages
  }

  getPythonVersion() {
    return this.pythonVersion
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      version: this.pythonVersion,
      packages: this.installedPackages,
      port: this.port
    }
  }
}

module.exports = PythonRunner
