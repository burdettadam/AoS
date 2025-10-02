#!/bin/bash

echo "🤖 Starting Blood on the Clock Tower with AI NPCs..."
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "🐳 Starting services with AI support..."

# Start all services including Ollama
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."

# Wait for Ollama to be healthy
echo "🧠 Waiting for Ollama to download model (this may take a few minutes)..."
timeout=300  # 5 minutes
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose exec ollama ollama list | grep -q "deepseek-r1"; then
        echo "✅ Ollama is ready with DeepSeek-R1 model!"
        break
    fi

    if [ $counter -eq 60 ]; then
        echo "⏳ Still downloading model... (this can take 5-10 minutes for the 4.7GB model)"
    fi

    sleep 5
    counter=$((counter + 5))
done

if [ $counter -ge $timeout ]; then
    echo "⚠️  Ollama startup timeout. Check logs with: docker-compose logs ollama"
else
    echo ""
    echo "🎮 Services are starting up!"
    echo ""
    echo "📋 Service URLs:"
    echo "   • Game Client:    http://localhost:5173"
    echo "   • Game Server:    http://localhost:3001"
    echo "   • Keycloak:       http://localhost:8080"
    echo "   • Ollama API:     http://localhost:11434"
    echo ""
    echo "🤖 AI NPC Features:"
    echo "   • DeepSeek-R1 7B model ready for intelligent NPCs"
    echo "   • Automatic character personality generation"
    echo "   • Strategic voting and discussion participation"
    echo ""
    echo "🧪 To test AI integration:"
    echo "   docker-compose exec botct-server npx ts-node packages/server/src/ai/test-ai-integration.ts"
    echo ""
    echo "📊 Monitor logs:"
    echo "   docker-compose logs -f botct-server"
    echo "   docker-compose logs -f ollama"
fi
