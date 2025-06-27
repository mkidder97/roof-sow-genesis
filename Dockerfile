# Multi-stage Dockerfile for roof-sow-genesis
# Vite + React + TypeScript frontend with MCP/Python tooling support

# ============================================
# Stage 1: Node.js Build Environment
# ============================================
FROM node:20-alpine AS node-builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use system chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 2: Python Environment (for MCP tools)
# ============================================
FROM python:3.11-slim AS python-base

# Set working directory
WORKDIR /mcp

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy MCP tools and requirements
COPY mcp-tools/ ./mcp-tools/
COPY server/ ./server/

# Install Python dependencies for MCP tools
RUN if [ -f "mcp-tools/requirements.txt" ]; then \
        pip install --no-cache-dir -r mcp-tools/requirements.txt; \
    fi

# Install additional MCP dependencies
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    requests \
    pydantic \
    python-multipart

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM nginx:alpine AS production

# Install Node.js, Python, and system dependencies
RUN apk add --no-cache \
    nodejs \
    npm \
    python3 \
    py3-pip \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    bash

# Set Puppeteer environment
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy built frontend from node-builder stage
COPY --from=node-builder /app/dist /usr/share/nginx/html

# Copy MCP tools from python-base stage
COPY --from=python-base /mcp /app/mcp

# Copy Node.js dependencies for runtime (if needed)
COPY --from=node-builder /app/node_modules /app/node_modules
COPY --from=node-builder /app/package.json /app/package.json

# Copy configuration files
COPY nginx.conf /etc/nginx/nginx.conf 2>/dev/null || echo "No nginx.conf found, using default"

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash

# Start Python MCP server in background (if exists)
if [ -f "/app/mcp/server/main.py" ]; then
    echo "Starting MCP Python server..."
    cd /app/mcp && python3 -m uvicorn server.main:app --host 0.0.0.0 --port 8001 &
fi

# Start Node.js services in background (if needed)
if [ -f "/app/server/index.js" ]; then
    echo "Starting Node.js backend server..."
    cd /app && node server/index.js &
fi

# Start Nginx
echo "Starting Nginx..."
nginx -g 'daemon off;'
EOF

RUN chmod +x /app/start.sh

# Create nginx configuration for SPA routing
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend services
    location /api/ {
        proxy_pass http://localhost:8001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy MCP tools
    location /mcp/ {
        proxy_pass http://localhost:8001/mcp/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Expose ports
EXPOSE 80 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Set startup command
CMD ["/app/start.sh"]

# ============================================
# Development Stage (optional)
# ============================================
FROM node:20-alpine AS development

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    bash \
    curl

# Set Puppeteer environment
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Install Python dependencies for MCP tools
RUN if [ -f "mcp-tools/requirements.txt" ]; then \
        pip3 install --break-system-packages -r mcp-tools/requirements.txt; \
    fi

# Expose development ports
EXPOSE 8080 8001 5173

# Development command
CMD ["npm", "run", "dev"]

# ============================================
# Build Arguments and Labels
# ============================================
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL \
    org.opencontainers.image.title="roof-sow-genesis" \
    org.opencontainers.image.description="Dynamic SOW Generator for Commercial Roof Systems" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.created="${BUILD_DATE}" \
    org.opencontainers.image.revision="${VCS_REF}" \
    org.opencontainers.image.vendor="Southern Roof Consultants" \
    org.opencontainers.image.url="https://github.com/mkidder97/roof-sow-genesis" \
    org.opencontainers.image.documentation="https://github.com/mkidder97/roof-sow-genesis#readme" \
    org.opencontainers.image.source="https://github.com/mkidder97/roof-sow-genesis"