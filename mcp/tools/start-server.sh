#!/bin/bash

# MCP Tools Server Startup Script
# Location: mcp/tools/start-server.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DEFAULT_HOST="0.0.0.0"
DEFAULT_PORT="8001"
VENV_DIR="venv"
REQUIREMENTS_FILE="requirements.txt"

# Parse command line arguments
HOST=${1:-$DEFAULT_HOST}
PORT=${2:-$DEFAULT_PORT}
MODE=${3:-"development"}

log_info "Starting SOW Generation MCP Server..."
log_info "Host: $HOST"
log_info "Port: $PORT"
log_info "Mode: $MODE"

# Check if we're in the right directory
if [ ! -f "api_server.py" ]; then
    log_error "api_server.py not found. Please run this script from the mcp/tools directory."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    log_info "Creating Python virtual environment..."
    python3 -m venv $VENV_DIR
    log_success "Virtual environment created"
fi

# Activate virtual environment
log_info "Activating virtual environment..."
source $VENV_DIR/bin/activate

# Upgrade pip
log_info "Upgrading pip..."
pip install --upgrade pip

# Install requirements
if [ -f "$REQUIREMENTS_FILE" ]; then
    log_info "Installing Python dependencies..."
    pip install -r $REQUIREMENTS_FILE
    log_success "Dependencies installed"
else
    log_warning "No requirements.txt found, installing basic dependencies..."
    pip install fastapi uvicorn pydantic python-multipart
fi

# Create data directories
log_info "Creating data directories..."
mkdir -p ../../data/{takeoff,sow,pdf}
log_success "Data directories ready"

# Check if orchestrator imports work
log_info "Testing MCP tools imports..."
python3 -c "
try:
    from sow_orchestrator import SOWOrchestrator
    from validate_takeoff_data import TakeoffValidator
    from generate_sow_summary import generate_pdf_summary
    print('✅ All imports successful')
except ImportError as e:
    print(f'❌ Import error: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    log_error "Import test failed. Please check your Python environment."
    exit 1
fi

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Start the server
log_success "Starting FastAPI server..."
log_info "Server will be available at: http://$HOST:$PORT"
log_info "API Documentation: http://$HOST:$PORT/docs"
log_info "Health Check: http://$HOST:$PORT/api/health"
log_info ""
log_info "Press Ctrl+C to stop the server"
log_info "=" * 50

# Start server with appropriate settings based on mode
if [ "$MODE" = "production" ]; then
    # Production mode - no reload, optimized settings
    uvicorn api_server:app \
        --host $HOST \
        --port $PORT \
        --workers 4 \
        --access-log \
        --log-level info
else
    # Development mode - with reload
    uvicorn api_server:app \
        --host $HOST \
        --port $PORT \
        --reload \
        --log-level debug
fi