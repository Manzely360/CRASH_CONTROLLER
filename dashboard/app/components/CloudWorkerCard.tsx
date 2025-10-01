'use client'

import { Play, Square, Settings, DollarSign, Clock, Activity, Monitor, Terminal, Code, ExternalLink } from 'lucide-react'
import { Worker } from '../types'

interface CloudWorkerCardProps {
  worker: Worker
  onStart: () => void
  onStop: () => void
}

export default function CloudWorkerCard({ worker, onStart, onStop }: CloudWorkerCardProps) {
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
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-900">{worker.id}</h3>
          <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
            Cloud
          </span>
        </div>
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

        {/* Cloud-specific features */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Cloud Access</div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={worker.remoteAccess?.desktop}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              <Monitor className="h-3 w-3 mr-1" />
              Desktop
            </a>
            <a
              href={worker.remoteAccess?.terminal}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              <Terminal className="h-3 w-3 mr-1" />
              Terminal
            </a>
            <a
              href={worker.remoteAccess?.devTools}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              <Code className="h-3 w-3 mr-1" />
              DevTools
            </a>
            <button
              onClick={() => window.open(`/python-runner/${worker.id}`, '_blank')}
              className="flex items-center justify-center px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
            >
              <Code className="h-3 w-3 mr-1" />
              Python
            </button>
          </div>
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
