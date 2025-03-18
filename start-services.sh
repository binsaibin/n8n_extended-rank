#!/bin/bash

# Start NLP Services
# This script starts the n8n, kiwi, and wink services

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
echo -e "${BOLD}${BLUE}=== NLP Services Starter ===${RESET}"
echo "This script starts n8n, kiwi, and wink services"
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

# Check if all services are already running
RUNNING_SERVICES=$(docker ps --filter name='kiwi-service\|wink-service\|n8n' --format '{{.Names}}' | wc -l)
if [ "$RUNNING_SERVICES" -eq "3" ]; then
    echo -e "${GREEN}All services are already running!${RESET}"
    exit 0
fi

# Start services
echo -e "${YELLOW}Starting services...${RESET}"
docker-compose down  # First bring down any existing services
sleep 2  # Give time for containers to stop
docker-compose up -d --build  # Rebuild and start the services

# Check if services started successfully
sleep 5
STARTED_SERVICES=$(docker ps --filter name='kiwi-service\|wink-service\|n8n' --format '{{.Names}}' | wc -l)

if [ "$STARTED_SERVICES" -eq "3" ]; then
    echo -e "${GREEN}All services started successfully!${RESET}"
    
    # Display service URLs
    echo
    echo -e "${BOLD}Service URLs:${RESET}"
    echo -e "${BLUE}n8n:${RESET} http://localhost:5678"
    echo -e "${BLUE}Kiwi:${RESET} http://localhost:3000"
    echo -e "${BLUE}Wink:${RESET} http://localhost:3001"
    
    # Suggest running tests
    echo
    echo -e "${BOLD}To run tests, execute:${RESET}"
    echo -e "  cd ~/custom-n8n/tests && ./run-tests.sh"
else
    echo -e "${RED}Some services failed to start. Check logs with:${RESET}"
    echo -e "  docker-compose logs"
fi 