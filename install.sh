#!/bin/bash

# Mimir ROSS Webhook Server - Installation Script
# This script installs and configures the Mimir webhook server on macOS

set -e  # Exit on error

echo "=================================================="
echo "Mimir ROSS Webhook Server - Installation"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS only"
    exit 1
fi

print_success "Running on macOS"

# Check for Homebrew
echo ""
print_info "Checking for Homebrew..."
if ! command -v brew &> /dev/null; then
    print_warning "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    print_success "Homebrew installed"
else
    print_success "Homebrew found"
fi

# Check for Node.js
echo ""
print_info "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing Node.js..."
    brew install node
    print_success "Node.js installed"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install Node.js manually."
    exit 1
else
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
fi

# Install Cloudflare Tunnel (cloudflared)
echo ""
print_info "Checking for Cloudflare Tunnel..."
if ! command -v cloudflared &> /dev/null; then
    print_warning "Cloudflare Tunnel not found. Installing..."
    brew install cloudflared
    print_success "Cloudflare Tunnel installed"
else
    print_success "Cloudflare Tunnel found"
fi

# Create project directory
echo ""
print_info "Setting up project directory..."
INSTALL_DIR="${1:-$HOME/Mimir-ROSS-Server}"
echo "Installation directory: $INSTALL_DIR"

if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory already exists: $INSTALL_DIR"
    read -p "Do you want to overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Installation cancelled"
        exit 1
    fi
    rm -rf "$INSTALL_DIR"
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"
print_success "Created directory: $INSTALL_DIR"

# Create directory structure
print_info "Creating directory structure..."
mkdir -p logs
mkdir -p ROSS_Images
mkdir -p public
print_success "Directory structure created"

# Install npm dependencies
echo ""
print_info "Installing npm dependencies..."
cat > package.json << 'EOF'
{
  "name": "mimir-ross-webhook-server",
  "version": "1.0.0",
  "description": "Webhook server for Mimir ROSS folder synchronization",
  "main": "mimir-webhook-server.js",
  "scripts": {
    "start": "node mimir-webhook-server.js"
  },
  "keywords": ["mimir", "webhook", "sync"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0"
  }
}
EOF

npm install
print_success "Dependencies installed"

# Configuration
echo ""
echo "=================================================="
echo "Configuration"
echo "=================================================="
echo ""
print_info "Please provide the following configuration details:"
echo ""

read -p "Mimir ROSS Folder ID: " FOLDER_ID
read -p "Mimir API Key: " API_KEY
read -p "Server Port (default: 3000): " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-3000}

# Create configuration file
cat > config.json << EOF
{
  "rossFolderId": "$FOLDER_ID",
  "apiKey": "$API_KEY",
  "port": $SERVER_PORT,
  "mimirApiUrl": "https://us.mjoll.no/api/v1",
  "logFile": "logs/mimir-ross.log",
  "downloadDir": "ROSS_Images",
  "heartbeatInterval": 5
}
EOF

print_success "Configuration saved to config.json"

# Success message
echo ""
echo "=================================================="
print_success "Installation Complete!"
echo "=================================================="
echo ""
print_info "Next steps:"
echo ""
echo "1. Copy the server files to: $INSTALL_DIR"
echo "   - mimir-webhook-server.js"
echo "   - public/* (all GUI files)"
echo ""
echo "2. Start the server:"
echo "   cd $INSTALL_DIR"
echo "   node mimir-webhook-server.js"
echo ""
echo "3. Access the dashboard at: http://localhost:$SERVER_PORT"
echo ""
echo "4. Configure the webhook in Mimir:"
echo "   - The Cloudflare Tunnel URL will be shown when you start the server"
echo "   - Use: https://[tunnel-url]/webhook/mimir-ross"
echo ""
print_info "For more information, see INSTALLATION.md"
echo ""
