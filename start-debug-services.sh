#!/bin/bash

# Debug NLP Services
# This script starts the n8n, kiwi, and wink services with additional debugging

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RESET="\033[0m"

# Configuration directory
CONFIG_DIR="$HOME/custom-n8n/config"

# Print header
echo -e "${BOLD}${BLUE}=== NLP Services Debug Starter ===${RESET}"
echo "This script starts n8n, kiwi, and wink services with additional debugging"
echo

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${RESET}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed. Please install Docker Compose first.${RESET}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${RESET}"
    exit 1
fi

# Clean up old containers and volumes
echo -e "${YELLOW}Cleaning up old containers...${RESET}"
docker-compose -f "$CONFIG_DIR/docker-compose.yml" down
docker rm -f kiwi-service wink-service n8n n8n-reverse-proxy 2>/dev/null || true

# Check for required files and dependencies
echo -e "${YELLOW}Validating project files...${RESET}"

# Check kiwi-service files
if [ ! -f "$HOME/custom-n8n/src/kiwi-service/kiwi-service.js" ]; then
    echo -e "${RED}Error: kiwi-service.js not found!${RESET}"
    exit 1
else
    echo -e "${GREEN}✓${RESET} kiwi-service.js found"
fi

if [ ! -f "$HOME/custom-n8n/src/kiwi-service/kiwi-textrank-endpoint.js" ]; then
    echo -e "${RED}Error: kiwi-textrank-endpoint.js not found!${RESET}"
    exit 1
else
    echo -e "${GREEN}✓${RESET} kiwi-textrank-endpoint.js found"
fi

# Check kiwi-addon files
if [ ! -d "$HOME/custom-n8n/src/kiwi-addon" ]; then
    echo -e "${RED}Error: kiwi-addon directory not found!${RESET}"
    exit 1
else
    echo -e "${GREEN}✓${RESET} kiwi-addon directory found"
fi

# Check wink-service files
if [ ! -f "$HOME/custom-n8n/src/wink-service/wink-service.js" ]; then
    echo -e "${RED}Error: wink-service.js not found!${RESET}"
    exit 1
else
    echo -e "${GREEN}✓${RESET} wink-service.js found"
fi

if [ ! -f "$HOME/custom-n8n/src/wink-service/wink-textrank-endpoint.js" ]; then
    echo -e "${RED}Error: wink-textrank-endpoint.js not found!${RESET}"
    exit 1
else
    echo -e "${GREEN}✓${RESET} wink-textrank-endpoint.js found"
fi

# Check textrank-bridge.js
if [ ! -f "$HOME/custom-n8n/src/summarization/textrank-bridge.js" ]; then
    echo -e "${RED}Error: textrank-bridge.js not found!${RESET}"
    exit 1
else
    echo -e "${GREEN}✓${RESET} textrank-bridge.js found"
fi

# Check if Dockerfile exists for each service
if [ ! -f "$HOME/custom-n8n/docker/kiwi/Dockerfile" ]; then
    echo -e "${RED}Error: Kiwi Dockerfile not found!${RESET}"
    exit 1
else
    echo -e "${GREEN}✓${RESET} Kiwi Dockerfile found"
fi

if [ ! -f "$HOME/custom-n8n/docker/wink/Dockerfile" ]; then
    echo -e "${RED}Error: Wink Dockerfile not found!${RESET}"
    exit 1
else
    echo -e "${GREEN}✓${RESET} Wink Dockerfile found"
fi

if [ ! -f "$HOME/custom-n8n/docker/n8n/Dockerfile" ]; then
    echo -e "${RED}Error: n8n Dockerfile not found!${RESET}"
    exit 1
else
    echo -e "${GREEN}✓${RESET} n8n Dockerfile found"
fi

# Check if docker-compose.yml exists
if [ ! -f "$CONFIG_DIR/docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found!${RESET}"
    exit 1
else
    echo -e "${GREEN}✓${RESET} docker-compose.yml found"
fi

# Check if n8n_data volume exists, create if it doesn't
VOLUME_EXISTS=$(docker volume ls -q --filter name=n8n_data | wc -l)
if [ "$VOLUME_EXISTS" -eq "0" ]; then
    echo -e "${YELLOW}Creating n8n_data volume...${RESET}"
    docker volume create n8n_data
    echo -e "${GREEN}✓${RESET} n8n_data volume created"
else
    echo -e "${GREEN}✓${RESET} n8n_data volume already exists"
fi

# Create logs directory if it doesn't exist
if [ ! -d "$CONFIG_DIR/logs" ]; then
    echo -e "${YELLOW}Creating logs directory...${RESET}"
    mkdir -p "$CONFIG_DIR/logs"
    chmod 777 "$CONFIG_DIR/logs"  # Ensure docker containers can write to the logs directory
    echo -e "${GREEN}✓${RESET} Logs directory created with write permissions"
else
    echo -e "${GREEN}✓${RESET} Logs directory already exists"
fi

# Change to the config directory
cd "$CONFIG_DIR"

# Rebuild the images with no cache to ensure latest code
echo -e "${YELLOW}Rebuilding images (no cache)...${RESET}"
docker-compose build --no-cache

# Start services
echo -e "${YELLOW}Starting services...${RESET}"
docker-compose up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${RESET}"
sleep 10

# Check if services started successfully
STARTED_SERVICES=$(docker ps --filter name='kiwi-service\|wink-service\|n8n' --format '{{.Names}}' | wc -l)

if [ "$STARTED_SERVICES" -eq "3" ]; then
    echo -e "${GREEN}All services started successfully!${RESET}"
    
    # Display service URLs
    echo
    echo -e "${BOLD}Service URLs:${RESET}"
    echo -e "${BLUE}n8n:${RESET} http://localhost:5678"
    echo -e "${BLUE}Kiwi:${RESET} http://localhost:3000"
    echo -e "${BLUE}Wink:${RESET} http://localhost:3001"
    
    # Check service health
    echo
    echo -e "${BOLD}Checking service health...${RESET}"
    
    # Check kiwi-service health
    KIWI_HEALTH=$(curl -s http://localhost:3000/health || echo "Failed")
    if [[ "$KIWI_HEALTH" == *"healthy"* ]]; then
        echo -e "${GREEN}✓${RESET} Kiwi service is healthy"
    else
        echo -e "${RED}✗${RESET} Kiwi service health check failed"
        echo -e "${YELLOW}Checking Kiwi service logs...${RESET}"
        docker logs kiwi-service
    fi
    
    # Check wink-service health
    WINK_HEALTH=$(curl -s http://localhost:3001/health || echo "Failed")
    if [[ "$WINK_HEALTH" == *"healthy"* ]]; then
        echo -e "${GREEN}✓${RESET} Wink service is healthy"
    else
        echo -e "${RED}✗${RESET} Wink service health check failed"
        echo -e "${YELLOW}Checking Wink service logs...${RESET}"
        docker logs wink-service
    fi
    
    # Test summarization module
    echo
    echo -e "${BOLD}Testing TextRank summarization module...${RESET}"
    echo -e "${YELLOW}To run tests, execute:${RESET}"
    echo -e "  cd ~/custom-n8n/src/summarization && npm install && npm test"
else
    echo -e "${RED}Some services failed to start. Checking logs...${RESET}"
    
    # Check each service
    if ! docker ps | grep -q kiwi-service; then
        echo -e "${RED}✗${RESET} Kiwi service failed to start. Logs:"
        docker logs kiwi-service
    fi
    
    if ! docker ps | grep -q wink-service; then
        echo -e "${RED}✗${RESET} Wink service failed to start. Logs:"
        docker logs wink-service
    fi
    
    if ! docker ps | grep -q n8n; then
        echo -e "${RED}✗${RESET} n8n failed to start. Logs:"
        docker logs n8n
    fi
fi 