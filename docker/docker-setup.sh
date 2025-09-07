#!/bin/bash
set -euo pipefail

# Always run from the directory containing this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🐳 Setting up BotCT Docker Development Environment"

# Check Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Pick compose command (v1 or v2)
if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
else
        echo "❌ Docker Compose is not installed. Install Docker Desktop or the docker-compose plugin."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
$COMPOSE down || true

# Build and start services
echo "🔨 Building and starting services..."
$COMPOSE up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

# Check if Keycloak is ready
echo "🔐 Checking Keycloak status..."
until curl -fsS http://localhost:8080/realms/botct/.well-known/openid-configuration >/dev/null 2>&1; do
    echo "   Waiting for Keycloak to be ready..."
    sleep 5
done

echo "✅ Setup complete!"
echo ""
echo "🌐 Services are available at:"
echo "   • Main Application: http://localhost"
echo "   • Keycloak Admin: http://localhost:8080/admin (admin/admin)"
echo "   • Client (direct): http://localhost:5173"
echo "   • Server (direct): http://localhost:3001"
echo ""
echo "👤 Test user credentials:"
echo "   • Username: testuser"
echo "   • Password: password"
echo ""
echo "🔧 To stop services: $COMPOSE down"
echo "📝 To view logs: docker compose logs -f [service-name]"
