#!/bin/bash

# Deployment script for DeployAI
# This script is used by GitHub Actions to deploy the application

set -e

echo "Starting deployment process..."

# Pull latest Docker images
echo "Pulling latest Docker images..."
docker compose pull

# Stop existing containers
echo "Stopping existing containers..."
docker compose down

# Start new containers
echo "Starting new containers..."
docker compose up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check service status
echo "Checking service status..."
docker compose ps

# Clean up old images
echo "Cleaning up old images..."
docker image prune -f

echo "Deployment completed successfully!"
