const express = require('express')
const router = express.Router()

module.exports = (workerManager, telemetryService) => {
  // Get all workers
  router.get('/', (req, res) => {
    try {
      const workers = workerManager.getAllWorkers()
      res.json({ success: true, workers })
    } catch (error) {
      console.error('Failed to get workers:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Get specific worker
  router.get('/:workerId', (req, res) => {
    try {
      const { workerId } = req.params
      const worker = workerManager.getWorker(workerId)
      
      if (!worker) {
        return res.status(404).json({ success: false, error: 'Worker not found' })
      }
      
      res.json({ success: true, worker })
    } catch (error) {
      console.error('Failed to get worker:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Start specific worker
  router.post('/:workerId/start', async (req, res) => {
    try {
      const { workerId } = req.params
      const { profile = 'relaxed' } = req.body
      
      const worker = await workerManager.startWorker(workerId, profile)
      
      // Record command
      telemetryService.recordCommand(workerId, 'start', { profile })
      
      res.json({ success: true, worker })
    } catch (error) {
      console.error('Failed to start worker:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // Stop specific worker
  router.post('/:workerId/stop', async (req, res) => {
    try {
      const { workerId } = req.params
      
      const worker = await workerManager.stopWorker(workerId)
      
      // Record command
      telemetryService.recordCommand(workerId, 'stop', {})
      
      res.json({ success: true, worker })
    } catch (error) {
      console.error('Failed to stop worker:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // Start all workers
  router.post('/start-all', async (req, res) => {
    try {
      const { profile = 'relaxed' } = req.body
      
      const results = await workerManager.startAllWorkers(profile)
      
      // Record commands for all workers
      results.forEach(result => {
        if (result.success) {
          telemetryService.recordCommand(result.workerId, 'start', { profile })
        }
      })
      
      res.json({ success: true, results })
    } catch (error) {
      console.error('Failed to start all workers:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Stop all workers
  router.post('/stop-all', async (req, res) => {
    try {
      const results = await workerManager.stopAllWorkers()
      
      // Record commands for all workers
      results.forEach(result => {
        if (result.success) {
          telemetryService.recordCommand(result.workerId, 'stop', {})
        }
      })
      
      res.json({ success: true, results })
    } catch (error) {
      console.error('Failed to stop all workers:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Get worker history
  router.get('/:workerId/history', async (req, res) => {
    try {
      const { workerId } = req.params
      const { hours = 24 } = req.query
      
      const history = await telemetryService.getWorkerHistory(workerId, parseInt(hours))
      
      res.json({ success: true, history })
    } catch (error) {
      console.error('Failed to get worker history:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Get system metrics
  router.get('/metrics/system', async (req, res) => {
    try {
      const { hours = 24 } = req.query
      
      const metrics = await telemetryService.getSystemMetrics(parseInt(hours))
      
      res.json({ success: true, metrics })
    } catch (error) {
      console.error('Failed to get system metrics:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  return router
}
