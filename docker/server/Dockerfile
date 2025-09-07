FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install
RUN cd packages/shared && npm install
RUN cd packages/server && npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Build shared package
RUN cd packages/shared && npm run build

# Install nodemon globally for development
RUN npm install -g nodemon ts-node

WORKDIR /app/packages/server

EXPOSE 3001

CMD ["npm", "run", "dev"]
