#!/bin/bash

# Shopify Product Summary Service - Startup Script

set -e

echo "Starting Shopify Product Summary Service..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker."
    exit 1
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "Prerequisites check passed"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Start Redis
echo "Starting Redis..."
if docker ps -a | grep -q redis; then
    if docker ps | grep -q redis; then
        echo "Redis container is already running"
    else
        echo "Starting existing Redis container..."
        docker start redis
    fi
else
    echo "Creating new Redis container..."
    docker run -d -p 6379:6379 --name redis redis:alpine
fi

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
sleep 2

# Test Redis connection
if redis-cli ping &> /dev/null || docker exec redis redis-cli ping &> /dev/null; then
    echo "Redis is ready"
else
    echo "Warning: Could not verify Redis connection, but continuing..."
fi
echo ""

# Build the project
echo "Building project..."
npm run build
echo ""

# Check if port 3000 is in use
if lsof -ti:3000 &> /dev/null; then
    echo "Port 3000 is already in use. Killing existing process..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Start the server
echo "Starting server..."
echo ""
npm start

