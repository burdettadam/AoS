FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Expose port for health checks (not used for MCP communication)
EXPOSE 3002

# Start the MCP server
CMD ["node", "dist/index.js"]
