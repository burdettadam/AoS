#!/bin/bash

# Smoke test for public games functionality
# This script tests the new privacy features via API calls

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Public Games Feature Smoke Tests"
echo "=================================="

# Test 1: Create a public game
echo -n "📝 Creating public game... "
PUBLIC_GAME_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"gameName": "Smoke Test Public Game", "isPublic": true}' \
  "$BASE_URL/api/games")

PUBLIC_GAME_ID=$(echo $PUBLIC_GAME_RESPONSE | grep -o '"gameId":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$PUBLIC_GAME_ID" ]; then
  echo -e "${GREEN}✓ Created game: $PUBLIC_GAME_ID${NC}"
else
  echo -e "${RED}✗ Failed to create public game${NC}"
  echo "Response: $PUBLIC_GAME_RESPONSE"
  exit 1
fi

# Test 2: Create a private game
echo -n "📝 Creating private game... "
PRIVATE_GAME_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"gameName": "Smoke Test Private Game", "isPublic": false}' \
  "$BASE_URL/api/games")

PRIVATE_GAME_ID=$(echo $PRIVATE_GAME_RESPONSE | grep -o '"gameId":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$PRIVATE_GAME_ID" ]; then
  echo -e "${GREEN}✓ Created game: $PRIVATE_GAME_ID${NC}"
else
  echo -e "${RED}✗ Failed to create private game${NC}"
  echo "Response: $PRIVATE_GAME_RESPONSE"
  exit 1
fi

# Test 3: Check public games endpoint
echo -n "🔍 Checking public games list... "
PUBLIC_GAMES=$(curl -s "$BASE_URL/api/games/public")
PUBLIC_COUNT=$(echo $PUBLIC_GAMES | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')

if [ "$PUBLIC_COUNT" -ge "1" ]; then
  echo -e "${GREEN}✓ Found $PUBLIC_COUNT public game(s)${NC}"
else
  echo -e "${RED}✗ No public games found${NC}"
  echo "Response: $PUBLIC_GAMES"
  exit 1
fi

# Test 4: Verify private game is not in public list
echo -n "🔒 Verifying private game exclusion... "
if echo "$PUBLIC_GAMES" | grep -q "$PRIVATE_GAME_ID"; then
  echo -e "${RED}✗ Private game found in public list!${NC}"
  exit 1
else
  echo -e "${GREEN}✓ Private game correctly excluded${NC}"
fi

# Test 5: Verify public game is in public list
echo -n "🌐 Verifying public game inclusion... "
if echo "$PUBLIC_GAMES" | grep -q "$PUBLIC_GAME_ID"; then
  echo -e "${GREEN}✓ Public game correctly included${NC}"
else
  echo -e "${RED}✗ Public game not found in public list!${NC}"
  exit 1
fi

# Test 6: Check total games count
echo -n "📊 Verifying total games count... "
ALL_GAMES=$(curl -s "$BASE_URL/api/games")
TOTAL_COUNT=$(echo $ALL_GAMES | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')

if [ "$TOTAL_COUNT" -ge "2" ]; then
  echo -e "${GREEN}✓ Found $TOTAL_COUNT total game(s)${NC}"
else
  echo -e "${RED}✗ Expected at least 2 games, found $TOTAL_COUNT${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "Summary:"
echo "  - Public game ID: $PUBLIC_GAME_ID"
echo "  - Private game ID: $PRIVATE_GAME_ID" 
echo "  - Public games visible: $PUBLIC_COUNT"
echo "  - Total games: $TOTAL_COUNT"
echo ""
echo "✨ Public games feature is working correctly!"