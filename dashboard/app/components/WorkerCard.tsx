'use client'

import { Play, Square, Settings, DollarSign, Clock, Activity } from 'lucide-react'
import { Worker } from '../types'

interface WorkerCardProps {
  worker: Worker
  onStart: () => void
  onStop: () => void
}

export default function WorkerCard({ worker, onStart, onStop }: WorkerCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'status-online'
      case 'offline': return 'status-offline'
      case 'deploying': return 'status-deploying'
      default: return 'status-offline'
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{worker.id}</h3>
        <span className={getStatusColor(worker.status)}>
          {worker.status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <DollarSign className="h-4 w-4 mr-1" />
            Balance
          </div>
          <span className="font-medium text-gray-900">
            ${worker.balance.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Activity className="h-4 w-4 mr-1" />
            Last Win
          </div>
          <span className="font-medium text-gray-900">
            ${worker.lastWin.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            Uptime
          </div>
          <span className="font-medium text-gray-900">
            {formatUptime(worker.uptime)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Settings className="h-4 w-4 mr-1" />
            Profile
          </div>
          <span className="font-medium text-gray-900 capitalize">
            {worker.currentProfile || 'none'}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Rounds: {worker.totalRounds}</span>
            <span>Success: {(worker.successRate * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex space-x-2 pt-3">
          {worker.status === 'online' ? (
            <button
              onClick={onStop}
              className="btn btn-danger flex-1 flex items-center justify-center"
            >
              <Square className="h-4 w-4 mr-1" />
              Stop
            </button>
          ) : (
            <button
              onClick={onStart}
              className="btn btn-success flex-1 flex items-center justify-center"
            >
              <Play className="h-4 w-4 mr-1" />
              Start
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
