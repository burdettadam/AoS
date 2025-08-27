#!/bin/bash

# Blood on the Clocktower Digital - Setup Script
echo "🎲 Setting up Blood on the Clocktower Digital..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install root dependencies"
    exit 1
fi

# Install package dependencies
echo "📦 Installing package dependencies..."

echo "  Installing shared package..."
cd packages/shared && npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install shared package dependencies"
    exit 1
fi
cd ../..

echo "  Installing server package..."
cd packages/server && npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server package dependencies"
    exit 1
fi
cd ../..

echo "  Installing client package..."
cd packages/client && npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client package dependencies"
    exit 1
fi
cd ../..

# Build shared package
echo "🔨 Building shared package..."
cd packages/shared && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build shared package"
    exit 1
fi
cd ../..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running the application"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your configuration"
echo "2. Start Redis and PostgreSQL servers (if using)"
echo "3. Run 'npm run dev' to start the development servers"
echo ""
echo "The application will be available at:"
echo "  - Client: http://localhost:3000"
echo "  - Server: http://localhost:3001"
echo ""
echo "For more information, see README.md"
