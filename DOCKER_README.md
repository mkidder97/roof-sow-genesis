# Docker Setup for roof-sow-genesis

## Overview

This Dockerfile provides a complete containerized solution for the roof-sow-genesis application, supporting both development and production environments with integrated MCP/Python tooling.

## Quick Start

### Production Deployment
```bash
# Build and run production container
docker build -t roof-sow-genesis .
docker run -p 80:80 roof-sow-genesis

# Or use docker-compose
docker-compose up
```

### Development Setup
```bash
# Build development container
docker build --target development -t roof-sow-genesis:dev .

# Run with hot reloading
docker run -p 8080:8080 -v $(pwd):/app roof-sow-genesis:dev

# Or use docker-compose for development
docker-compose --profile development up roof-sow-dev
```

## Build Script Usage

Make the build script executable and use it:
```bash
chmod +x docker-build.sh

# Build production image
./docker-build.sh production

# Build development image
./docker-build.sh development

# Build all images
./docker-build.sh all
```

## Architecture

### Multi-Stage Build
1. **Node.js Build Environment** - Builds the Vite/React frontend
2. **Python Environment** - Prepares MCP tools and Python dependencies
3. **Production Runtime** - Nginx + Node.js + Python in Alpine Linux
4. **Development Stage** - Full development environment with hot reloading

### Ports
- **80**: Production frontend (Nginx)
- **8080**: Development frontend (Vite dev server)
- **8001**: MCP/Python backend API
- **5173**: Alternative Vite dev port

### Services Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   MCP Tools     │    │   Backend API   │
│   (React/Vite)  │───▶│   (Python)      │───▶│   (Node.js)     │
│   Port: 80/8080 │    │   Port: 8001    │    │   Port: 8001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Environment Variables

### Required
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Optional
- `VITE_API_URL`: Backend API URL (default: http://localhost:8001)
- `NODE_ENV`: Environment (development/production)
- `POSTGRES_PASSWORD`: Database password for local Supabase
- `JWT_SECRET`: JWT secret for authentication

## Docker Compose Profiles

### Default (Production)
```bash
docker-compose up
```
Starts: roof-sow-genesis

### Development
```bash
docker-compose --profile development up
```
Starts: roof-sow-dev with hot reloading

### Local Database
```bash
docker-compose --profile local-db up
```
Starts: roof-sow-genesis + supabase-db

### Full Stack
```bash
docker-compose --profile development --profile local-db --profile cache up
```
Starts: All services including Redis cache

## Volume Mounts

### Production
- `logs:/app/logs` - Application logs
- `./config:/app/config:ro` - Configuration files (read-only)

### Development
- `.:/app` - Source code for hot reloading
- `/app/node_modules` - Exclude node_modules from mount
- `./config:/app/config:ro` - Configuration files

## Health Checks

The container includes health checks on:
- HTTP endpoint: `http://localhost/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

## Features

### Frontend (Vite + React + TypeScript)
- ✅ Hot reloading in development
- ✅ Optimized production builds
- ✅ SPA routing support
- ✅ Static asset caching
- ✅ Gzip compression

### Backend Integration
- ✅ Node.js runtime for PDF generation
- ✅ Python environment for MCP tools
- ✅ Puppeteer support with system Chromium
- ✅ API proxy configuration

### Development Features
- ✅ Source code mounting for hot reloads
- ✅ Development server on port 8080
- ✅ Debugging support
- ✅ Live configuration reloading

## Troubleshooting

### Build Issues
```bash
# Clear Docker build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t roof-sow-genesis .
```

### Permission Issues
```bash
# Fix file permissions
chmod +x docker-build.sh
```

### Port Conflicts
```bash
# Check what's using the ports
lsof -i :80
lsof -i :8080
lsof -i :8001
```

### Container Logs
```bash
# View container logs
docker logs roof-sow-genesis-roof-sow-genesis-1

# Follow logs
docker logs -f roof-sow-genesis-roof-sow-genesis-1
```

## Security Considerations

- Runs as non-root user in production
- Uses multi-stage builds to minimize attack surface
- Excludes development dependencies in production
- Implements proper CORS and proxy configurations
- Includes security headers in Nginx config

## Performance Optimizations

- Multi-stage builds reduce final image size
- Static asset caching with proper headers
- Gzip compression enabled
- Node.js process optimization
- Efficient layer caching strategy

## Contributing

When adding new features:
1. Update Dockerfile if new dependencies are needed
2. Update docker-compose.yml for new services
3. Update this README with new environment variables or ports
4. Test both development and production builds