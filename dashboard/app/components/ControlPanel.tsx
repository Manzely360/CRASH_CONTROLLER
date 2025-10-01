'use client'

import { Play, Square, Settings } from 'lucide-react'
import { MovementProfile } from '../types'

interface ControlPanelProps {
  selectedProfile: MovementProfile
  onProfileChange: (profile: MovementProfile) => void
  onStartAll: () => void
  onStopAll: () => void
  isConnected: boolean
}

const movementProfiles: { value: MovementProfile; label: string; description: string }[] = [
  { value: 'relaxed', label: 'Relaxed', description: '200-500ms delays, human-like' },
  { value: 'normal', label: 'Normal', description: '100-300ms delays, balanced' },
  { value: 'fast', label: 'Fast', description: '50-150ms delays, quick' },
  { value: 'aggressive', label: 'Aggressive', description: '20-80ms delays, rapid' },
]

export default function ControlPanel({
  selectedProfile,
  onProfileChange,
  onStartAll,
  onStopAll,
  isConnected
}: ControlPanelProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">Control Panel</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-danger-500'}`} />
          <span className="text-sm text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movement Profile Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Movement Profile
          </label>
          <div className="space-y-2">
            {movementProfiles.map((profile) => (
              <label key={profile.value} className="flex items-start">
                <input
                  type="radio"
                  name="profile"
                  value={profile.value}
                  checked={selectedProfile === profile.value}
                  onChange={(e) => onProfileChange(e.target.value as MovementProfile)}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {profile.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {profile.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Global Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Global Actions
          </label>
          <div className="space-y-3">
            <button
              onClick={onStartAll}
              disabled={!isConnected}
              className="btn btn-success w-full flex items-center justify-center"
            >
              <Play className="h-4 w-4 mr-2" />
              Start All Workers
            </button>
            
            <button
              onClick={onStopAll}
              disabled={!isConnected}
              className="btn btn-danger w-full flex items-center justify-center"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop All Workers
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Safety Notice</p>
                <p className="mt-1">
                  All workers interact only with the local mock site. 
                  No real gambling or external accounts are used.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
