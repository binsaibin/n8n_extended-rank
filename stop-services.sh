#!/bin/bash

# Stop NLP Services
# This script stops the n8n, kiwi, and wink services

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
echo -e "${BOLD}${BLUE}=== NLP Services Stopper ===${RESET}"
echo "This script stops n8n, kiwi, and wink services"
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

# Check if any of the services are running
RUNNING_SERVICES=$(docker ps --filter name='kiwi-service\|wink-service\|n8n\|textrank-service' --format '{{.Names}}')
if [ -z "$RUNNING_SERVICES" ]; then
    echo -e "${YELLOW}No services are currently running.${RESET}"
    exit 0
else
    echo -e "${BOLD}Currently running services:${RESET}"
    echo "$RUNNING_SERVICES" | while read service; do
        echo -e "${GREEN}✓${RESET} $service"
    done
    echo
fi

# Change to the config directory
cd "$CONFIG_DIR"

# Stop services
echo -e "${YELLOW}Stopping services...${RESET}"
docker-compose down

# Check if services stopped successfully
STOPPED_SERVICES=$(docker ps --filter name='kiwi-service\|wink-service\|n8n\|textrank-service' --format '{{.Names}}' | wc -l)

if [ "$STOPPED_SERVICES" -eq "0" ]; then
    echo -e "${GREEN}All services stopped successfully!${RESET}"
else
    echo -e "${RED}Some services failed to stop. Trying to force stop...${RESET}"
    
    # Force stop any remaining containers
    docker ps --filter name='kiwi-service\|wink-service\|n8n\|textrank-service' --format '{{.Names}}' | xargs -r docker stop
    
    # Check again
    REMAINING_SERVICES=$(docker ps --filter name='kiwi-service\|wink-service\|n8n\|textrank-service' --format '{{.Names}}' | wc -l)
    if [ "$REMAINING_SERVICES" -eq "0" ]; then
        echo -e "${GREEN}All services have been stopped.${RESET}"
    else
        echo -e "${RED}Failed to stop some services. Please check manually with:${RESET}"
        echo -e "  docker ps"
    fi
fi 