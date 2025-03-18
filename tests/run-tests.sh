#!/bin/bash

# Run NLP Services Tests
# This script runs tests for kiwi-service and wink-service

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Print header
echo -e "${BOLD}${BLUE}=== NLP Services Test Runner ===${RESET}"
echo "This script runs tests for kiwi-service and wink-service"
echo

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running or not accessible${RESET}"
  exit 1
fi

# Functions to check if services are running
check_service() {
  local service_name=$1
  local container_running=$(docker ps --filter "name=^/${service_name}$" --format "{{.Names}}" | wc -l)
  
  if [ "$container_running" -eq "1" ]; then
    echo -e "${GREEN}✓${RESET} $service_name is running"
    return 0
  else
    echo -e "${RED}✗${RESET} $service_name is not running"
    return 1
  fi
}

# Check services
echo -e "${BOLD}Checking services:${RESET}"
check_service "kiwi-service"
kiwi_running=$?
check_service "wink-service"
wink_running=$?
echo

# Get service URLs
if [ $kiwi_running -eq 0 ]; then
  KIWI_SERVICE_URL="http://localhost:3000"
  echo "Using Kiwi service at: $KIWI_SERVICE_URL"
fi

if [ $wink_running -eq 0 ]; then
  WINK_SERVICE_URL="http://localhost:3001"
  echo "Using Wink service at: $WINK_SERVICE_URL"
fi
echo

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo
fi

# Run tests
echo -e "${BOLD}Running tests:${RESET}"

# Run Kiwi tests if service is running
if [ $kiwi_running -eq 0 ]; then
  echo -e "${BOLD}Running Kiwi Tests:${RESET}"
  KIWI_SERVICE_URL=$KIWI_SERVICE_URL npm run test:kiwi
else
  echo -e "${RED}Skipping Kiwi tests - service not running${RESET}"
fi
echo

# Run Wink tests if service is running
if [ $wink_running -eq 0 ]; then
  echo -e "${BOLD}Running Wink Tests:${RESET}"
  WINK_SERVICE_URL=$WINK_SERVICE_URL npm run test:wink
else
  echo -e "${RED}Skipping Wink tests - service not running${RESET}"
fi
echo

# 결과 디렉토리 생성
mkdir -p test-results

# 시작 시간 기록
START_TIME=$(date +%s)

echo "🚀 Starting test execution..."

# Kiwi 서비스 테스트 실행
echo "Running Kiwi Service Tests..."
node kiwi-test/test-kiwi-service.js 2>&1 | tee test-results/kiwi-test.log
KIWI_EXIT=${PIPESTATUS[0]}

# Wink 서비스 테스트 실행
echo "Running Wink Service Tests..."
node wink-test/test-wink-service.js 2>&1 | tee test-results/wink-test.log
WINK_EXIT=${PIPESTATUS[0]}

# 종료 시간 기록 및 소요 시간 계산
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 테스트 결과 요약 생성
{
  echo "Test Execution Summary"
  echo "====================="
  echo "Date: $(date)"
  echo "Duration: ${DURATION} seconds"
  echo ""
  echo "Kiwi Service Tests: $(if [ $KIWI_EXIT -eq 0 ]; then echo '✅ PASSED'; else echo '❌ FAILED'; fi)"
  echo "Wink Service Tests: $(if [ $WINK_EXIT -eq 0 ]; then echo '✅ PASSED'; else echo '❌ FAILED'; fi)"
  echo ""
  echo "Detailed logs can be found in:"
  echo "- test-results/kiwi-test.log"
  echo "- test-results/wink-test.log"
} > test-results/summary.txt

# 결과 출력
cat test-results/summary.txt

# 종료 코드 설정
if [ $KIWI_EXIT -eq 0 ] && [ $WINK_EXIT -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed!"
  exit 1
fi

echo -e "${BOLD}${BLUE}=== Test Run Completed ===${RESET}" 