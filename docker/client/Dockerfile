FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install
RUN cd packages/shared && npm install
RUN cd packages/client && npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/client ./packages/client

# Build shared package
RUN cd packages/shared && npm run build

WORKDIR /app/packages/client

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
