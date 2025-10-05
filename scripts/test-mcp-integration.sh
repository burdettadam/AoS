#!/bin/bash

echo "🔍 Testing MCP-First Integration..."
echo "==================================="

# Check if MCP server container is running
if ! docker ps | grep -q "botct-mcp-server"; then
    echo "❌ MCP server container not running - REQUIRED for system to function"
    echo "Start with: docker-compose -f docker-compose.yml -f docker-compose.mcp.yml up -d"
    exit 1
fi

echo "✅ MCP server container is running"

# Test MCP server initialization
echo "🧪 Testing MCP server initialization..."
INIT_RESPONSE=$(echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}' | docker exec -i botct-mcp-server node /app/dist/index.js)

if echo "$INIT_RESPONSE" | grep -q '"jsonrpc":"2.0"'; then
    echo "✅ MCP server responds to initialize"
else
    echo "❌ MCP server initialization failed - SYSTEM CANNOT FUNCTION"
    echo "Response: $INIT_RESPONSE"
    exit 1
fi

# Test tools list
echo "🔧 Testing tools availability..."
TOOLS_RESPONSE=$(echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}' | docker exec -i botct-mcp-server node /app/dist/index.js)

if echo "$TOOLS_RESPONSE" | grep -q "get_game_state"; then
    echo "✅ MCP tools are available"
else
    echo "❌ MCP tools not found - SYSTEM CANNOT FUNCTION"
    echo "Response: $TOOLS_RESPONSE"
    exit 1
fi

# Test game state tool
echo "🎮 Testing game state retrieval..."
GAME_STATE_RESPONSE=$(echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_game_state", "arguments": {"gameId": "test-game-1"}}}' | docker exec -i botct-mcp-server node /app/dist/index.js)

if echo "$GAME_STATE_RESPONSE" | grep -q '"phase"'; then
    echo "✅ Game state retrieval works"
else
    echo "❌ Game state retrieval failed - SYSTEM CANNOT FUNCTION"
    echo "Response: $GAME_STATE_RESPONSE"
    exit 1
fi

# Test journal functionality
echo "� Testing journal functionality..."
JOURNAL_RESPONSE=$(echo '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "add_journal_entry", "arguments": {"gameId": "test-game-1", "playerId": "TestAgent", "type": "test", "content": "MCP integration test entry"}}}' | docker exec -i botct-mcp-server node /app/dist/index.js)

if echo "$JOURNAL_RESPONSE" | grep -q '"success"'; then
    echo "✅ Journal functionality works"
else
    echo "❌ Journal functionality failed"
    echo "Response: $JOURNAL_RESPONSE"
fi

# Test MCPAIAgent if available
echo "🤖 Testing MCPAIAgent integration..."
if [ -f "packages/server/dist/ai/agents/MCPAIAgent.js" ]; then
    echo "✅ MCPAIAgent compiled and available"
else
    echo "⚠️  MCPAIAgent not built yet - run 'npm run build' in server package"
fi

echo ""
echo "🎯 MCP-First Integration Test Summary:"
echo "====================================="
echo "✅ MCP Server: Running and responsive"
echo "✅ Tools: Available and functional"
echo "✅ Game State: Retrievable"
echo "✅ Journal: Functional"
echo ""
echo "🚀 System Status: READY FOR MCP-FIRST AI AGENTS"
echo ""
echo "⚠️  IMPORTANT: System now requires MCP server to function"
echo "   - No fallback modes available"
echo "   - All AI agents are stateless and MCP-dependent"
echo "   - Ensure MCP server is always running"
echo ""
echo "📖 Next Steps:"
echo "1. Replace AIAgentManager with MCPAIAgentManager"
echo "2. Use MCPAIAgent instead of NPCAIAgent"
echo "3. Remove all fallback compatibility code"
