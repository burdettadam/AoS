#!/bin/bash
# Delete the Keycloak realm via admin REST API before starting Keycloak

KEYCLOAK_URL="http://localhost:8080"
REALM="botct"
ADMIN_USER="admin"
ADMIN_PASS="admin"

# Get admin token
TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -d "grant_type=password&client_id=admin-cli&username=$ADMIN_USER&password=$ADMIN_PASS" | jq -r .access_token)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to get admin token. Is Keycloak running and admin credentials correct?"
  exit 1
fi

# Delete the realm
curl -s -X DELETE "$KEYCLOAK_URL/admin/realms/$REALM" \
  -H "Authorization: Bearer $TOKEN"

echo "Realm '$REALM' deleted. Restart Keycloak to re-import realm and apply theme."
