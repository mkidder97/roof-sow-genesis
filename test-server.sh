#!/bin/bash

# Test script for Roof SOW Genesis server
# This helps you test the fixed server implementation

echo "🧪 Testing Roof SOW Genesis Server..."
echo "======================================"

# Check if we're in the right directory
if [ ! -f "server/package.json" ]; then
    echo "❌ Please run this from the root directory (roof-sow-genesis/)"
    exit 1
fi

cd server

echo "📋 Checking environment setup..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "💡 The .env file should be created automatically from GitHub"
    exit 1
else
    echo "✅ .env file found"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting server with enhanced error handling..."
echo "   If you see Supabase initialization messages, the fix worked!"
echo "   Press Ctrl+C to stop the server"
echo ""

# Start the server
npx tsx index-enhanced-content.ts
