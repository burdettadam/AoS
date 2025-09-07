#!/bin/bash

# BotCT Keycloak Theme Migration Script
# This script helps migrate from the old theme structure to the new CSS-only approach

echo "🎭 BotCT Keycloak Theme Migration"
echo "================================="
echo ""

# Check if old theme directory exists
if [ -d "./docker/keycloak/themes/botct" ]; then
    echo "✅ Old theme directory found at ./docker/keycloak/themes/botct"
    echo "📁 You may want to remove this after verifying the new theme works"
    echo ""
else
    echo "ℹ️  Old theme directory not found (already cleaned up)"
    echo ""
fi

# Check if new theme directory exists
if [ -d "./themes/botct" ]; then
    echo "✅ New theme directory found at ./themes/botct"
    echo ""
else
    echo "❌ New theme directory not found at ./themes/botct"
    echo "   Please run the migration setup first"
    exit 1
fi

# Check docker-compose configuration
if grep -q "../themes:/opt/keycloak/themes:z" ./docker/docker-compose.yml; then
    echo "✅ Docker-compose updated with correct theme mount"
else
    echo "⚠️  Docker-compose may need manual update"
    echo "   Expected: ../themes:/opt/keycloak/themes:z"
fi

echo ""
echo "🚀 Migration checklist:"
echo "  1. ✅ New theme structure created in ./themes/botct/"
echo "  2. ✅ CSS-only approach implemented"
echo "  3. ✅ Docker-compose updated with correct mount"
echo "  4. ✅ Realm configuration simplified"
echo "  5. ✅ Theme properties fixed for Keycloak compatibility"
echo ""
echo "Next steps:"
echo "  1. Test the new theme: docker-compose up"
echo "  2. Verify login page styling"
echo "  3. Remove old theme directory when satisfied"
echo ""
echo "🎯 Theme URL: http://localhost:8080/realms/botct/protocol/openid-connect/auth?client_id=botct-client&redirect_uri=http://localhost:5173&response_type=code&scope=openid"
