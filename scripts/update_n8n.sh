#!/bin/bash

# 1. Stop current containers
echo "Stopping current containers..."
docker-compose down

# 2. Build with --pull to get the latest base image
echo "Rebuilding containers with latest base image..."
docker-compose build --pull

# 3. Start containers in detached mode
echo "Starting containers..."
docker-compose up -d

# 4. Wait for n8n container to start (optional)
echo "Waiting for n8n container to start..."
sleep 10

echo "Update complete. n8n is now running with the latest version and external modules."
