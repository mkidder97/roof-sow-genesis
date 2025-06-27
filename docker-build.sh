#!/bin/bash

# Docker build script for roof-sow-genesis
# Usage: ./docker-build.sh [production|development|all]

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

# Get build arguments
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')

# Default target
TARGET=${1:-production}

log_info "Building roof-sow-genesis Docker image..."
log_info "Target: $TARGET"
log_info "Version: $VERSION"
log_info "Build Date: $BUILD_DATE"
log_info "Git Ref: $VCS_REF"

case $TARGET in
    "production")
        log_info "Building production image..."
        docker build \
            --target production \
            --build-arg BUILD_DATE="$BUILD_DATE" \
            --build-arg VCS_REF="$VCS_REF" \
            --build-arg VERSION="$VERSION" \
            -t roof-sow-genesis:latest \
            -t roof-sow-genesis:$VERSION \
            -t roof-sow-genesis:production \
            .
        log_success "Production image built successfully!"
        ;;
    
    "development")
        log_info "Building development image..."
        docker build \
            --target development \
            --build-arg BUILD_DATE="$BUILD_DATE" \
            --build-arg VCS_REF="$VCS_REF" \
            --build-arg VERSION="$VERSION" \
            -t roof-sow-genesis:development \
            -t roof-sow-genesis:dev \
            .
        log_success "Development image built successfully!"
        ;;
    
    "all")
        log_info "Building all images..."
        
        # Build development first
        docker build \
            --target development \
            --build-arg BUILD_DATE="$BUILD_DATE" \
            --build-arg VCS_REF="$VCS_REF" \
            --build-arg VERSION="$VERSION" \
            -t roof-sow-genesis:development \
            -t roof-sow-genesis:dev \
            .
        
        # Build production
        docker build \
            --target production \
            --build-arg BUILD_DATE="$BUILD_DATE" \
            --build-arg VCS_REF="$VCS_REF" \
            --build-arg VERSION="$VERSION" \
            -t roof-sow-genesis:latest \
            -t roof-sow-genesis:$VERSION \
            -t roof-sow-genesis:production \
            .
        
        log_success "All images built successfully!"
        ;;
    
    *)
        log_error "Invalid target: $TARGET"
        log_info "Usage: $0 [production|development|all]"
        exit 1
        ;;
esac

# Show built images
log_info "Built images:"
docker images | grep roof-sow-genesis

# Show usage examples
echo ""
log_info "Usage examples:"
echo "  Production:   docker run -p 80:80 roof-sow-genesis:latest"
echo "  Development:  docker run -p 8080:8080 -v \$(pwd):/app roof-sow-genesis:dev"
echo "  Compose:      docker-compose up"
echo "  Dev Compose:  docker-compose --profile development up"

log_success "Build completed!"