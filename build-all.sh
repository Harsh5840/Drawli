#!/bin/bash

# Exit on error
set -e

# Build http-backend
echo "Building http-backend..."
docker build -t harshshukla031/http-backend:latest -f apps/http-backend/Dockerfile .

# Build ws-backend
echo "Building ws-backend..."
docker build -t harshshukla031/ws-backend:latest -f apps/ws-backend/Dockerfile .

# Build drawli-front
echo "Building drawli-front..."
docker build -t harshshukla031/drawli-front:latest -f apps/drawli-front/Dockerfile .

echo "\nAll services built successfully!"
echo "\nTo run the services, use:"
echo "docker-compose -f docker-compose.prod.yml up -d"
