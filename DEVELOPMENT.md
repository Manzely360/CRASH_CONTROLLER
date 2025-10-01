# Development Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Running the System

1. **Clone and start everything:**
   ```bash
   git clone <repository>
   cd CRASH_CONTROLLER
   docker-compose up --build
   ```

2. **Access the services:**
   - Dashboard: http://localhost:3000
   - Mock Crash Site: http://localhost:3001
   - Controller API: http://localhost:3002

### Development Mode

For active development, run each service separately:

```bash
# Terminal 1: Mock Crash Site
cd mock-crash
npm install
npm run dev

# Terminal 2: Controller API
cd controller
npm install
npm run dev

# Terminal 3: Dashboard
cd dashboard
npm install
npm run dev

# Terminal 4: Worker (requires Docker)
cd worker
docker build -t crash-worker .
docker run -e WORKER_ID=dev-worker-1 -e CONTROLLER_URL=http://localhost:3002 -e MOCK_CRASH_URL=http://localhost:3001 crash-worker
```

## Architecture Overview

### Components

1. **Dashboard** (`/dashboard`)
   - Next.js frontend
   - Real-time worker monitoring
   - Control panel for worker management
   - WebSocket connection to controller

2. **Controller** (`/controller`)
   - Node.js API server
   - WebSocket server for real-time updates
   - Worker registration and management
   - Telemetry collection and storage

3. **Worker** (`/worker`)
   - Playwright-based browser automation
   - Docker container for consistency
   - Connects to controller via HTTP/WebSocket
   - Implements movement profiles

4. **Mock Crash Site** (`/mock-crash`)
   - Express.js web server
   - Simulates crash game mechanics
   - WebSocket for real-time updates
   - Safe testing target

### Data Flow

```
Dashboard ←→ Controller ←→ Workers
                ↓
         Mock Crash Site
```

## API Documentation

### Controller API Endpoints

#### Workers
- `GET /api/workers` - List all workers
- `GET /api/workers/:id` - Get specific worker
- `POST /api/workers/:id/start` - Start worker
- `POST /api/workers/:id/stop` - Stop worker
- `POST /api/workers/start-all` - Start all workers
- `POST /api/workers/stop-all` - Stop all workers

#### Telemetry
- `GET /api/workers/:id/history` - Get worker history
- `GET /api/workers/metrics/system` - Get system metrics

#### Registration
- `POST /api/workers/register` - Register new worker
- `POST /api/workers/:id/heartbeat` - Send worker heartbeat

### WebSocket Events

#### Controller → Dashboard
- `workers_update` - Worker status changes
- `game_state` - Game state updates

#### Controller → Worker
- `command` - Worker commands (start, stop, set_profile)

## Configuration

### Environment Variables

#### Dashboard
- `NEXT_PUBLIC_CONTROLLER_URL` - Controller API URL
- `NEXT_PUBLIC_MOCK_CRASH_URL` - Mock crash site URL

#### Controller
- `PORT` - API server port (default: 3000)
- `MOCK_CRASH_URL` - Mock crash site URL
- `DASHBOARD_URL` - Dashboard URL for CORS

#### Worker
- `WORKER_ID` - Unique worker identifier
- `CONTROLLER_URL` - Controller API URL
- `MOCK_CRASH_URL` - Mock crash site URL
- `WORKER_API_PORT` - Worker API port (default: 3001)

#### Mock Crash Site
- `PORT` - Web server port (default: 3000)

## Movement Profiles

Workers support different movement profiles for realistic simulation:

### Relaxed
- Click delays: 200-500ms
- Mouse delays: 100-300ms
- Action interval: 5 seconds
- Human-like, natural timing

### Normal
- Click delays: 100-300ms
- Mouse delays: 50-200ms
- Action interval: 3 seconds
- Balanced, efficient timing

### Fast
- Click delays: 50-150ms
- Mouse delays: 20-100ms
- Action interval: 2 seconds
- Quick, automated timing

### Aggressive
- Click delays: 20-80ms
- Mouse delays: 10-50ms
- Action interval: 1 second
- Rapid, bot-like timing

## Database Schema

### SQLite Tables

#### worker_heartbeats
- `id` - Primary key
- `worker_id` - Worker identifier
- `timestamp` - Heartbeat timestamp
- `status` - Worker status
- `balance` - Worker balance
- `last_win` - Last win amount
- `total_rounds` - Total rounds completed
- `success_rate` - Success rate percentage
- `response_time` - Average response time

#### worker_commands
- `id` - Primary key
- `worker_id` - Worker identifier
- `command_type` - Command type (start, stop, set_profile)
- `command_data` - Command parameters (JSON)
- `timestamp` - Command timestamp
- `status` - Command status

#### system_metrics
- `id` - Primary key
- `metric_name` - Metric name
- `metric_value` - Metric value
- `timestamp` - Metric timestamp
- `metadata` - Additional data (JSON)

## Testing

### Unit Tests
```bash
# Run tests for each component
cd controller && npm test
cd worker && npm test
cd mock-crash && npm test
```

### Integration Tests
```bash
# Start full system
docker-compose up

# Test worker registration
curl -X POST http://localhost:3002/api/workers/register \
  -H "Content-Type: application/json" \
  -d '{"workerId": "test-worker", "capabilities": {}}'

# Test worker control
curl -X POST http://localhost:3002/api/workers/test-worker/start \
  -H "Content-Type: application/json" \
  -d '{"profile": "relaxed"}'
```

### Load Testing
```bash
# Scale workers
docker-compose up --scale worker-1=5 --scale worker-2=5 --scale worker-3=5
```

## Troubleshooting

### Common Issues

1. **Workers not connecting to controller**
   - Check controller URL in worker environment
   - Verify network connectivity between containers
   - Check controller logs for registration errors

2. **Dashboard not updating**
   - Verify WebSocket connection to controller
   - Check browser console for errors
   - Ensure controller is running and accessible

3. **Mock site not responding**
   - Check if mock-crash container is running
   - Verify port 3001 is accessible
   - Check mock-crash logs for errors

4. **Docker build failures**
   - Ensure Docker daemon is running
   - Check available disk space
   - Verify Dockerfile syntax

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs dashboard
docker-compose logs controller
docker-compose logs worker-1
docker-compose logs mock-crash

# Follow logs in real-time
docker-compose logs -f controller
```

### Debugging

```bash
# Access worker container
docker exec -it crash_controller_worker-1_1 /bin/bash

# Check worker status
curl http://localhost:3001/status

# Check controller health
curl http://localhost:3002/health

# Check mock site
curl http://localhost:3001/api/game/status
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use consistent formatting
- Add comments for complex logic
- Follow existing patterns
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.
