'use client'

import { useState } from 'react'
import { Plus, Cloud, Server, Monitor, Terminal, Code } from 'lucide-react'

interface CloudWorkerManagerProps {
  onCreateWorker: (config: CloudWorkerConfig) => void
}

interface CloudWorkerConfig {
  name: string
  region: string
  features: string[]
  targetUrl?: string
}

const regions = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' }
]

const features = [
  { value: 'remote-desktop', label: 'Remote Desktop', icon: Monitor },
  { value: 'terminal', label: 'Terminal Access', icon: Terminal },
  { value: 'devtools', label: 'Chrome DevTools', icon: Code },
  { value: 'python', label: 'Python Runner', icon: Code }
]

export default function CloudWorkerManager({ onCreateWorker }: CloudWorkerManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<CloudWorkerConfig>({
    name: '',
    region: 'us-east-1',
    features: [],
    targetUrl: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (config.name && config.region) {
      onCreateWorker(config)
      setConfig({ name: '', region: 'us-east-1', features: [], targetUrl: '' })
      setIsOpen(false)
    }
  }

  const toggleFeature = (feature: string) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">Cloud Workers</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Cloud Worker
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create Cloud Worker
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Worker Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="my-cloud-worker"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cloud Region
                </label>
                <select
                  value={config.region}
                  onChange={(e) => setConfig(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {regions.map(region => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target URL (Optional)
                </label>
                <input
                  type="url"
                  value={config.targetUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, targetUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {features.map(feature => {
                    const Icon = feature.icon
                    return (
                      <label
                        key={feature.value}
                        className="flex items-center p-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={config.features.includes(feature.value)}
                          onChange={() => toggleFeature(feature.value)}
                          className="mr-2"
                        />
                        <Icon className="h-4 w-4 mr-2" />
                        <span className="text-sm">{feature.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  Create Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Cloud className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">
              Cloud Workers
            </h4>
            <p className="mt-1 text-sm text-blue-700">
              Deploy workers to the cloud with remote desktop access, terminal access, 
              Chrome DevTools, and Python script execution capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
