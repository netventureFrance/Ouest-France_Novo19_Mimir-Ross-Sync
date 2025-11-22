#!/bin/bash
# Start the Mimir webhook server

cd "$(dirname "$0")/.."

echo "🚀 Starting Mimir Webhook Server..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
node mimir-webhook-server.js
