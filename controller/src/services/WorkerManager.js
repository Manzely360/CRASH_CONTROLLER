class WorkerManager {
  constructor(io) {
    this.workers = new Map()
    this.io = io
    this.heartbeatInterval = 30000 // 30 seconds
    this.startHeartbeatCleanup()
  }

  registerWorker(workerId, capabilities = {}) {
    const worker = {
      id: workerId,
      status: 'offline',
      balance: 100.00, // Starting balance for demo
      lastWin: 0,
      lastActivity: Date.now(),
      uptime: 0,
      totalRounds: 0,
      successRate: 0,
      currentProfile: 'relaxed',
      capabilities,
      registeredAt: Date.now()
    }
    
    this.workers.set(workerId, worker)
    return worker
  }

  updateWorkerStatus(workerId, updates) {
    const worker = this.workers.get(workerId)
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`)
    }

    // Update worker data
    Object.assign(worker, updates)
    
    // Calculate uptime
    if (worker.status === 'online') {
      worker.uptime = Math.floor((Date.now() - worker.registeredAt) / 1000)
    }

    this.workers.set(workerId, worker)
  }

  getWorker(workerId) {
    return this.workers.get(workerId)
  }

  getAllWorkers() {
    return Array.from(this.workers.values())
  }

  getWorkerCount() {
    return this.workers.size
  }

  getOnlineWorkers() {
    return this.getAllWorkers().filter(w => w.status === 'online')
  }

  async startWorker(workerId, profile = 'relaxed') {
    const worker = this.workers.get(workerId)
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`)
    }

    // In a real implementation, this would send a command to the worker
    // For demo purposes, we'll simulate the start
    worker.status = 'online'
    worker.currentProfile = profile
    worker.lastActivity = Date.now()
    
    this.workers.set(workerId, worker)
    
    // Notify dashboard
    this.io.emit('workers_update', {
      type: 'workers_update',
      workers: this.getAllWorkers()
    })

    return worker
  }

  async stopWorker(workerId) {
    const worker = this.workers.get(workerId)
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`)
    }

    worker.status = 'offline'
    worker.lastActivity = Date.now()
    
    this.workers.set(workerId, worker)
    
    // Notify dashboard
    this.io.emit('workers_update', {
      type: 'workers_update',
      workers: this.getAllWorkers()
    })

    return worker
  }

  async startAllWorkers(profile = 'relaxed') {
    const results = []
    for (const [workerId] of this.workers) {
      try {
        const result = await this.startWorker(workerId, profile)
        results.push({ workerId, success: true, worker: result })
      } catch (error) {
        results.push({ workerId, success: false, error: error.message })
      }
    }
    return results
  }

  async stopAllWorkers() {
    const results = []
    for (const [workerId] of this.workers) {
      try {
        const result = await this.stopWorker(workerId)
        results.push({ workerId, success: true, worker: result })
      } catch (error) {
        results.push({ workerId, success: false, error: error.message })
      }
    }
    return results
  }

  startHeartbeatCleanup() {
    setInterval(() => {
      const now = Date.now()
      const timeout = 60000 // 1 minute timeout
      
      for (const [workerId, worker] of this.workers) {
        if (worker.status === 'online' && (now - worker.lastActivity) > timeout) {
          console.log(`Worker ${workerId} timed out, marking as offline`)
          worker.status = 'offline'
          worker.lastActivity = now
          this.workers.set(workerId, worker)
        }
      }
      
      // Notify dashboard of any status changes
      this.io.emit('workers_update', {
        type: 'workers_update',
        workers: this.getAllWorkers()
      })
    }, this.heartbeatInterval)
  }

  removeWorker(workerId) {
    const removed = this.workers.delete(workerId)
    if (removed) {
      this.io.emit('workers_update', {
        type: 'workers_update',
        workers: this.getAllWorkers()
      })
    }
    return removed
  }
}

module.exports = WorkerManager
