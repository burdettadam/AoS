#!/bin/bash

# Test script for BotCT MCP Server
# This script tests all available tools to ensure they work correctly

cd "$(dirname "$0")"

echo "🧪 Testing BotCT MCP Server..."
echo

# Function to test MCP requests
test_request() {
    local description="$1"
    local request="$2"
    echo "Testing: $description"
    echo "$request" | node dist/index.js | tail -n 1 | jq .
    echo
}

# Build the server first
echo "📦 Building server..."
npm run build
echo

# Test 1: Initialize
test_request "Initialize" '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}'

# Test 2: List tools
test_request "List tools" '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}'

# Test 3: Game state tools
test_request "Get game state" '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_game_state", "arguments": {"gameId": "test-game-1"}}}'

test_request "Get player info" '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "get_player_info", "arguments": {"gameId": "test-game-1", "playerId": "Alice"}}}'

test_request "Get voting history" '{"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "get_voting_history", "arguments": {"gameId": "test-game-1"}}}'

test_request "Get character info" '{"jsonrpc": "2.0", "id": 6, "method": "tools/call", "params": {"name": "get_character_info", "arguments": {"characterId": "investigator"}}}'

# Test 4: NPC Profile tools
test_request "List NPC profiles" '{"jsonrpc": "2.0", "id": 7, "method": "tools/call", "params": {"name": "list_npc_profiles", "arguments": {}}}'

test_request "Get NPC profile" '{"jsonrpc": "2.0", "id": 8, "method": "tools/call", "params": {"name": "get_npc_profile", "arguments": {"profileId": "analytical-skeptic"}}}'

test_request "Update NPC behavior" '{"jsonrpc": "2.0", "id": 9, "method": "tools/call", "params": {"name": "update_npc_behavior", "arguments": {"profileId": "analytical-skeptic", "updates": {"aggressiveness": 0.8}}}}'

# Test 5: Journal tools
test_request "Get journal entries" '{"jsonrpc": "2.0", "id": 10, "method": "tools/call", "params": {"name": "get_journal_entries", "arguments": {"gameId": "test-game-1"}}}'

test_request "Add journal entry" '{"jsonrpc": "2.0", "id": 11, "method": "tools/call", "params": {"name": "add_journal_entry", "arguments": {"gameId": "test-game-1", "playerId": "Alice", "type": "observation", "content": "Dave seems suspicious - avoiding eye contact", "metadata": {"confidence": 0.7}}}}'

test_request "Get decision history" '{"jsonrpc": "2.0", "id": 12, "method": "tools/call", "params": {"name": "get_decision_history", "arguments": {"gameId": "test-game-1", "playerId": "Alice"}}}'

test_request "Get suspicion network" '{"jsonrpc": "2.0", "id": 13, "method": "tools/call", "params": {"name": "get_suspicion_network", "arguments": {"gameId": "test-game-1"}}}'

echo "✅ All tests completed!"
