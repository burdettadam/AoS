# BotCT Docker Development Environment

This setup provides a complete development environment with Keycloak authentication, hot reloading, and reverse proxy configuration using nginx.

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Browser       │────│    Nginx     │────│  Keycloak       │
│  localhost      │    │ (Port 80)    │    │ (Port 8080)     │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │                   │
          ┌─────────▼──────┐   ┌────────▼────────┐
          │ BotCT Client   │   │  BotCT Server   │
          │ (Port 5173)    │   │  (Port 3001)    │
          └────────────────┘   └─────────────────┘
```

## Features

- **🔐 Keycloak Authentication**: Complete OIDC/OAuth2 authentication flow
- **🔄 Hot Reloading**: File changes trigger automatic rebuilds
- **🌐 Reverse Proxy**: nginx handles routing and authentication
- **📱 Local Development**: Keep existing local dev workflow unchanged
- **🔒 Session Management**: Remember users across browser sessions

## Quick Start

1. **Prerequisites**
   - Docker and Docker Compose installed
   - No other services running on ports 80, 3001, 5173, or 8080

2. **Start the environment**
   ```bash
   cd docker
   ./docker-setup.sh
   ```

3. **Access the application**
   - Open http://localhost in your browser
   - You'll be redirected to login
   - Use test credentials: `testuser` / `password`

## Services

### Main Application (http://localhost)
- Protected by Keycloak authentication
- Automatically redirects to login if not authenticated
- User info passed via HTTP headers to both client and server

### Keycloak Admin (http://localhost:8080/auth/admin)
- Admin credentials: `admin` / `admin`
- Manage users, clients, and authentication settings
- Pre-configured with BotCT realm and test user

### Direct Service Access (Development)
- Client: http://localhost:5173 (bypass auth)
- Server: http://localhost:3001 (bypass auth)
- Use for debugging or local development without auth

## Authentication Flow

1. User accesses http://localhost
2. nginx checks for valid session
3. If no session, redirect to Keycloak login
4. After successful login, redirect back to application
5. User info available in HTTP headers:
   - `X-User-ID`: Keycloak user ID
   - `X-User-Email`: User email
   - `X-User-Name`: User display name

## File Watching & Hot Reload

Both client and server containers have volume mounts for source code:
- Changes to `/packages/client/src/*` trigger Vite HMR
- Changes to `/packages/server/src/*` trigger nodemon restart
- Changes to `/packages/shared/src/*` trigger builds in both

## Managing Users

### Adding Users via Keycloak Admin
1. Go to http://localhost:8080/auth/admin
2. Login with admin/admin
3. Navigate to BotCT realm → Users
4. Click "Add user"

### Adding Users via API (Future)
User management can be integrated into the application using Keycloak's Admin API.

## Development Workflow

### With Authentication (Recommended)
```bash
./docker-setup.sh
# Edit files in packages/client or packages/server
# Changes automatically reflected at http://localhost
```

### Local Development (No Auth)
```bash
npm run dev
# Traditional local development without Docker/auth
```

### Logs and Debugging
```bash
# View all logs
cd docker && docker compose logs -f

# View specific service logs
cd docker && docker compose logs -f botct-client
cd docker && docker compose logs -f botct-server
cd docker && docker compose logs -f nginx
cd docker && docker compose logs -f keycloak

# Access container shell
cd docker && docker compose exec botct-server sh
```

## Configuration

### Environment Variables
- `.env.docker`: Docker-specific environment variables
- Modify Keycloak settings in `docker/keycloak/realm-export.json`
- Modify nginx config in `docker/nginx/nginx.conf`

### Keycloak Client Settings
- Client ID: `botct-client`
- Client Secret: `your-client-secret` (change in production)
- Redirect URIs: `http://localhost/auth/callback`

## Stopping Services

```bash
cd docker && docker compose down

# Remove volumes (reset database)
cd docker && docker compose down -v
```

## Troubleshooting

### Port Conflicts
If you get port binding errors, check what's running:
```bash
lsof -i :80    # nginx
lsof -i :8080  # keycloak
lsof -i :5173  # client
lsof -i :3001  # server
```

### Keycloak Issues
- Wait 30-60 seconds for Keycloak to fully start
- Check logs: `cd docker && docker compose logs keycloak`
- Reset: `cd docker && docker compose down -v && ./docker-setup.sh`

### Authentication Issues
- Clear browser cookies for localhost
- Check nginx logs: `cd docker && docker compose logs nginx`
- Verify Keycloak realm import was successful

### Hot Reload Not Working
- Verify file mounts in docker-compose.yml
- Check that node_modules are excluded from volume mounts
- Restart containers: `cd docker && docker compose restart botct-client botct-server`
