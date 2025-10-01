'use client'

import { useState, useEffect } from 'react'
import { Play, Square, Settings, Activity, DollarSign, Clock } from 'lucide-react'
import WorkerCard from './components/WorkerCard'
import ControlPanel from './components/ControlPanel'
import { Worker, MovementProfile } from './types'

const CONTROLLER_URL = process.env.NEXT_PUBLIC_CONTROLLER_URL || 'http://localhost:3002'

export default function Dashboard() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<MovementProfile>('relaxed')

  useEffect(() => {
    // Connect to controller WebSocket
    const ws = new WebSocket(`ws://${CONTROLLER_URL.replace('http://', '')}`)
    
    ws.onopen = () => {
      setIsConnected(true)
      console.log('Connected to controller')
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'workers_update') {
        setWorkers(data.workers)
      }
    }
    
    ws.onclose = () => {
      setIsConnected(false)
      console.log('Disconnected from controller')
    }
    
    // Fetch initial workers data
    fetchWorkers()
    
    return () => {
      ws.close()
    }
  }, [])

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${CONTROLLER_URL}/api/workers`)
      const data = await response.json()
      setWorkers(data.workers || [])
    } catch (error) {
      console.error('Failed to fetch workers:', error)
    }
  }

  const startAllWorkers = async () => {
    try {
      await fetch(`${CONTROLLER_URL}/api/workers/start-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: selectedProfile })
      })
    } catch (error) {
      console.error('Failed to start workers:', error)
    }
  }

  const stopAllWorkers = async () => {
    try {
      await fetch(`${CONTROLLER_URL}/api/workers/stop-all`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to stop workers:', error)
    }
  }

  const onlineWorkers = workers.filter(w => w.status === 'online').length
  const totalWorkers = workers.length

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Connection</p>
              <p className={`text-lg font-semibold ${isConnected ? 'text-success-600' : 'text-danger-600'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Workers Online</p>
              <p className="text-lg font-semibold text-gray-900">
                {onlineWorkers} / {totalWorkers}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-success-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Balance</p>
              <p className="text-lg font-semibold text-gray-900">
                ${workers.reduce((sum, w) => sum + w.balance, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-warning-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Activity</p>
              <p className="text-lg font-semibold text-gray-900">
                {workers.length > 0 ? new Date(Math.max(...workers.map(w => w.lastActivity))).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <ControlPanel
        selectedProfile={selectedProfile}
        onProfileChange={setSelectedProfile}
        onStartAll={startAllWorkers}
        onStopAll={stopAllWorkers}
        isConnected={isConnected}
      />

      {/* Workers Grid */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Worker Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onStart={() => startWorker(worker.id)}
              onStop={() => stopWorker(worker.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

async function startWorker(workerId: string) {
  try {
    await fetch(`${CONTROLLER_URL}/api/workers/${workerId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: 'relaxed' })
    })
  } catch (error) {
    console.error('Failed to start worker:', error)
  }
}

async function stopWorker(workerId: string) {
  try {
    await fetch(`${CONTROLLER_URL}/api/workers/${workerId}/stop`, {
      method: 'POST'
    })
  } catch (error) {
    console.error('Failed to stop worker:', error)
  }
}
