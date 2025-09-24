#!/bin/bash
set -e

echo "🧪 Running comprehensive test suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1 && ! command -v docker > /dev/null 2>&1; then
    print_error "Docker Compose is not available."
    exit 1
fi

# Clean up any existing test containers
cleanup() {
    print_status "Cleaning up test environment..."
    cd docker && docker compose down -v --remove-orphans 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Build shared package first
print_status "Building shared package..."
cd packages/shared && npm run build && cd ../..

# Run unit tests for server
print_status "Running server unit tests..."
cd packages/server
npm run test
cd ../..

# Run unit tests for client (using Vitest)
print_status "Running client unit tests..."
cd packages/client
npm run test:coverage
cd ../..

# Start Docker Compose environment for E2E tests
print_status "Starting Docker Compose environment..."
cd docker
docker compose down -v --remove-orphans 2>/dev/null || true
docker compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
max_attempts=60
attempt=0

# Wait for client to be ready
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        print_status "Client is ready"
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Client failed to start within timeout"
    exit 1
fi

# Wait for server health check
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Server is ready"
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Server failed to start within timeout"
    exit 1
fi

cd ..

# Run Playwright tests
print_status "Running Playwright E2E tests..."
npx playwright test

# Run accessibility tests
print_status "Running accessibility audit..."
npx @axe-core/cli http://localhost:5173 --exit || print_warning "Accessibility issues found"

# Run Lighthouse audit
print_status "Running Lighthouse performance audit..."
npx lighthouse http://localhost:5173 --only-categories=performance,accessibility,best-practices --chrome-flags="--headless" --output=html --output-path=./test-results/lighthouse-report.html || print_warning "Lighthouse audit completed with issues"

print_status "✅ All tests completed!"
print_status "📊 Test results available in ./test-results/"