# Crash Controller - Architecture Overview

## System Architecture

This project implements a distributed browser automation system that demonstrates the same patterns used in legitimate testing frameworks like Selenium Grid or Playwright Docker deployments, but designed for safe educational purposes.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Controller    │    │    Workers      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Playwright)  │
│   Port: 3000    │    │   Port: 3002    │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         │                       │                       ▼
         │                       │              ┌─────────────────┐
         │                       │              │  Mock Crash     │
         │                       │              │  Site (Express) │
         │                       │              │  Port: 3001     │
         │                       │              └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   SQLite DB     │
│   Real-time     │    │   Telemetry     │
│   Updates       │    │   Storage       │
└─────────────────┘    └─────────────────┘
```

## Component Details

### 1. Dashboard (Frontend)
- **Technology**: Next.js with TypeScript
- **Purpose**: Real-time monitoring and control interface
- **Features**:
  - Worker status monitoring
  - Real-time balance tracking
  - Movement profile controls
  - Global start/stop controls
  - WebSocket integration for live updates

### 2. Controller (Orchestrator)
- **Technology**: Node.js with Express and Socket.IO
- **Purpose**: Central coordination and management
- **Features**:
  - Worker registration and management
  - Command distribution
  - Telemetry collection
  - WebSocket server for real-time communication
  - SQLite database for data persistence

### 3. Workers (Execution Units)
- **Technology**: Playwright with Docker containers
- **Purpose**: Browser automation execution
- **Features**:
  - Headless browser automation
  - Configurable movement profiles
  - Heartbeat monitoring
  - Mock site interaction
  - Scalable container deployment

### 4. Mock Crash Site (Test Target)
- **Technology**: Express.js with Socket.IO
- **Purpose**: Safe testing target
- **Features**:
  - Simulated crash game mechanics
  - Real-time game state updates
  - WebSocket communication
  - No real money or external accounts

## Data Flow

### 1. Worker Registration
```
Worker → Controller API → Database
       → WebSocket → Dashboard
```

### 2. Command Execution
```
Dashboard → Controller API → Worker
         → WebSocket → Real-time updates
```

### 3. Telemetry Collection
```
Worker → Controller API → SQLite DB
       → WebSocket → Dashboard
```

### 4. Game Simulation
```
Worker → Mock Site → Game Engine
       → WebSocket → Real-time updates
```

## Movement Profiles

The system implements configurable movement profiles to simulate different user behaviors:

| Profile | Click Delay | Mouse Delay | Interval | Description |
|---------|-------------|-------------|----------|-------------|
| Relaxed | 200-500ms | 100-300ms | 5s | Human-like, natural |
| Normal | 100-300ms | 50-200ms | 3s | Balanced, efficient |
| Fast | 50-150ms | 20-100ms | 2s | Quick, automated |
| Aggressive | 20-80ms | 10-50ms | 1s | Rapid, bot-like |

## Safety Measures

### 1. Mock Target Only
- All browser automation targets localhost:3001
- No external URLs or real gambling sites
- Simulated game mechanics without real money

### 2. Local Environment
- All components run in Docker containers
- No external API calls to real services
- No real user authentication

### 3. Educational Focus
- Demonstrates legitimate testing patterns
- Shows distributed system architecture
- Teaches browser automation concepts safely

## Scalability Patterns

### Horizontal Scaling
- Multiple worker containers
- Load balancing across workers
- Independent worker lifecycle management

### Vertical Scaling
- Configurable resource limits
- Memory and CPU optimization
- Database performance tuning

### Monitoring
- Real-time telemetry collection
- Performance metrics tracking
- Health check endpoints

## Technology Stack

### Frontend
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Socket.IO client for real-time updates
- Lucide React for icons

### Backend
- Node.js with Express
- Socket.IO for WebSocket communication
- SQLite for data persistence
- Axios for HTTP requests

### Browser Automation
- Playwright for browser control
- Docker for containerization
- Chromium for browser engine

### Infrastructure
- Docker Compose for orchestration
- Multi-stage Docker builds
- Health check endpoints
- Graceful shutdown handling

## Development Workflow

### 1. Local Development
```bash
# Start all services
./scripts/start-dev.sh

# Run tests
./scripts/test-system.sh

# Stop services
./scripts/stop-dev.sh
```

### 2. Production Deployment
```bash
# Build and start
docker-compose up --build -d

# Scale workers
docker-compose up --scale worker-1=5 --scale worker-2=5
```

### 3. Monitoring
```bash
# View logs
docker-compose logs -f

# Check health
curl http://localhost:3002/health
```

## Security Considerations

### 1. Network Isolation
- All services run in isolated Docker network
- No external network access required
- Localhost-only communication

### 2. Data Protection
- No sensitive data storage
- Mock data only
- No real credentials or API keys

### 3. Access Control
- No authentication required for demo
- Local development only
- No production deployment intended

## Performance Characteristics

### 1. Resource Usage
- Low memory footprint per worker
- Efficient browser automation
- Optimized Docker images

### 2. Scalability
- Linear scaling with worker count
- Independent worker processes
- Stateless controller design

### 3. Reliability
- Graceful error handling
- Automatic reconnection
- Health monitoring

## Future Enhancements

### 1. Advanced Features
- Custom script execution
- Advanced movement patterns
- Performance analytics
- Load testing capabilities

### 2. Integration
- CI/CD pipeline integration
- Cloud deployment options
- External monitoring tools
- API documentation

### 3. Educational
- Interactive tutorials
- Architecture diagrams
- Code walkthroughs
- Best practices guide

---

This architecture demonstrates real-world distributed system patterns while maintaining safety and educational value. It serves as a foundation for learning browser automation, containerization, and microservices architecture.
