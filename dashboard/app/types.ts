export type WorkerStatus = 'online' | 'offline' | 'deploying' | 'error'

export type MovementProfile = 'relaxed' | 'normal' | 'fast' | 'aggressive'

export interface Worker {
  id: string
  status: WorkerStatus
  balance: number
  lastWin: number
  lastActivity: number
  currentProfile?: MovementProfile
  uptime: number
  totalRounds: number
  successRate: number
}

export interface WorkerCommand {
  type: 'start' | 'stop' | 'set_profile'
  profile?: MovementProfile
  targetUrl?: string
}

export interface TelemetryData {
  workerId: string
  timestamp: number
  status: WorkerStatus
  balance: number
  lastWin: number
  profile: MovementProfile
  metrics: {
    roundsCompleted: number
    successRate: number
    averageResponseTime: number
  }
}
