# Backend Dockerfile - Python API with MCP Tools
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY mcp/tools/requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy MCP tools and source code
COPY mcp/ ./mcp/
COPY data/ ./data/

# Create data directories if they don't exist
RUN mkdir -p data/takeoff data/sow data/pdf

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose API port
EXPOSE 8001

# Health check for API
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8001/api/health || exit 1

# Change to tools directory and start API server
WORKDIR /app/mcp/tools
CMD ["python3", "api_server.py", "--host", "0.0.0.0", "--port", "8001"]