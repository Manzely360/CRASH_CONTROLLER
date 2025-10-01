# Crash Controller - Distributed Browser Automation System

A safe, educational demonstration of distributed browser automation architecture for testing purposes only.

## Architecture Overview

This system demonstrates a distributed browser automation pattern similar to Selenium Grid or Playwright Docker deployments, but designed for safe testing and educational purposes.

### Components

1. **Dashboard** (`/dashboard`) - Next.js frontend for monitoring and controlling workers
2. **Controller** (`/controller`) - Node.js API orchestrator with WebSocket communication
3. **Worker** (`/worker`) - Playwright-based browser automation agents in Docker containers
4. **Mock Crash Site** (`/mock-crash`) - Safe test target simulating a crash game interface

## Safety Notice

⚠️ **This is for educational and testing purposes only**
- All interactions target a local mock site
- No real gambling or external accounts
- No real money or cryptocurrency involved
- Safe for demonstration and learning

## Quick Start

```bash
# Start the entire system
docker-compose up

# Access the dashboard
open http://localhost:3000

# Access the mock crash site
open http://localhost:3001
```

## Development

Each component can be developed independently:

```bash
# Dashboard
cd dashboard && npm run dev

# Controller
cd controller && npm run dev

# Worker (requires Docker)
cd worker && docker build -t crash-worker .

# Mock site
cd mock-crash && npm run dev
```

## Architecture Benefits

- **Separation of Concerns**: UI, orchestration, and execution are decoupled
- **Scalability**: Easy to add/remove workers
- **Reproducibility**: Docker ensures consistent environments
- **Safety**: All testing against local mock targets
- **Educational**: Demonstrates real-world distributed system patterns
