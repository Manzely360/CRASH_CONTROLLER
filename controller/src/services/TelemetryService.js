const sqlite3 = require('sqlite3').verbose()
const path = require('path')

class TelemetryService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/telemetry.db')
    this.db = new sqlite3.Database(this.dbPath)
    this.initializeDatabase()
  }

  initializeDatabase() {
    const createTables = `
      CREATE TABLE IF NOT EXISTS worker_heartbeats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        status TEXT NOT NULL,
        balance REAL NOT NULL,
        last_win REAL NOT NULL,
        total_rounds INTEGER DEFAULT 0,
        success_rate REAL DEFAULT 0,
        response_time REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS worker_commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id TEXT NOT NULL,
        command_type TEXT NOT NULL,
        command_data TEXT,
        timestamp INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `
    
    this.db.exec(createTables, (err) => {
      if (err) {
        console.error('Failed to initialize database:', err)
      } else {
        console.log('Telemetry database initialized')
      }
    })
  }

  recordHeartbeat(workerId, data) {
    const { status, balance, lastWin, metrics = {}, timestamp } = data
    
    const stmt = this.db.prepare(`
      INSERT INTO worker_heartbeats 
      (worker_id, timestamp, status, balance, last_win, total_rounds, success_rate, response_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run([
      workerId,
      timestamp,
      status,
      balance,
      lastWin,
      metrics.roundsCompleted || 0,
      metrics.successRate || 0,
      metrics.averageResponseTime || 0
    ], (err) => {
      if (err) {
        console.error('Failed to record heartbeat:', err)
      }
    })
    
    stmt.finalize()
  }

  recordCommand(workerId, commandType, commandData = {}) {
    const stmt = this.db.prepare(`
      INSERT INTO worker_commands 
      (worker_id, command_type, command_data, timestamp, status)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    stmt.run([
      workerId,
      commandType,
      JSON.stringify(commandData),
      Date.now(),
      'pending'
    ], (err) => {
      if (err) {
        console.error('Failed to record command:', err)
      }
    })
    
    stmt.finalize()
  }

  recordSystemMetric(metricName, value, metadata = {}) {
    const stmt = this.db.prepare(`
      INSERT INTO system_metrics 
      (metric_name, metric_value, timestamp, metadata)
      VALUES (?, ?, ?, ?)
    `)
    
    stmt.run([
      metricName,
      value,
      Date.now(),
      JSON.stringify(metadata)
    ], (err) => {
      if (err) {
        console.error('Failed to record system metric:', err)
      }
    })
    
    stmt.finalize()
  }

  getWorkerHistory(workerId, hours = 24) {
    return new Promise((resolve, reject) => {
      const cutoff = Date.now() - (hours * 60 * 60 * 1000)
      
      this.db.all(`
        SELECT * FROM worker_heartbeats 
        WHERE worker_id = ? AND timestamp > ?
        ORDER BY timestamp DESC
        LIMIT 1000
      `, [workerId, cutoff], (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  getSystemMetrics(hours = 24) {
    return new Promise((resolve, reject) => {
      const cutoff = Date.now() - (hours * 60 * 60 * 1000)
      
      this.db.all(`
        SELECT metric_name, AVG(metric_value) as avg_value, 
               MIN(metric_value) as min_value, MAX(metric_value) as max_value,
               COUNT(*) as data_points
        FROM system_metrics 
        WHERE timestamp > ?
        GROUP BY metric_name
      `, [cutoff], (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  cleanupOldData(days = 7) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
    
    this.db.run(`
      DELETE FROM worker_heartbeats WHERE timestamp < ?
    `, [cutoff], (err) => {
      if (err) {
        console.error('Failed to cleanup old heartbeats:', err)
      } else {
        console.log('Cleaned up old heartbeat data')
      }
    })
    
    this.db.run(`
      DELETE FROM worker_commands WHERE timestamp < ?
    `, [cutoff], (err) => {
      if (err) {
        console.error('Failed to cleanup old commands:', err)
      } else {
        console.log('Cleaned up old command data')
      }
    })
    
    this.db.run(`
      DELETE FROM system_metrics WHERE timestamp < ?
    `, [cutoff], (err) => {
      if (err) {
        console.error('Failed to cleanup old metrics:', err)
      } else {
        console.log('Cleaned up old metrics data')
      }
    })
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err)
      } else {
        console.log('Database connection closed')
      }
    })
  }
}

module.exports = TelemetryService
