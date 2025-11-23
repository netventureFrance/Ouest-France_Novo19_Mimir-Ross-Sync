# Mimir ROSS Webhook Server - Installation Guide

## Overview

The Mimir ROSS Webhook Server is a lightweight Node.js application that provides bidirectional synchronization between Mimir's ROSS folder and a local directory on macOS. It includes a web-based dashboard for monitoring and management.

### Key Features

- **Automatic Download**: Files uploaded to Mimir ROSS folder automatically sync to local directory
- **Web Dashboard**: Monitor sync status, view logs, and manage the server via browser
- **Cloudflare Tunnel**: Automatic secure tunnel creation for webhook connectivity
- **Real-time Monitoring**: Live logs, file counts, and sync status
- **Upload Integration**: Quick access to upload files via Mimir's web interface

### System Requirements

- **Operating System**: macOS (10.14 or later)
- **Internet Connection**: Required for Mimir API and Cloudflare Tunnel
- **Mimir Account**: With API key and folder access

---

## Quick Installation (Recommended)

### Step 1: Download Installation Package

Request the installation package containing:
```
Mimir-ROSS-Server/
├── install.sh                    # Installation script
├── mimir-webhook-server.js       # Main server file
├── package.json                  # Dependencies
├── public/                       # Web dashboard files
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── INSTALLATION.md              # This file
```

### Step 2: Run Installation Script

Open Terminal and navigate to the package directory:

```bash
cd /path/to/Mimir-ROSS-Server
chmod +x install.sh
./install.sh
```

The script will:
1. Check and install Homebrew (if needed)
2. Install Node.js and npm (if needed)
3. Install Cloudflare Tunnel (cloudflared)
4. Create directory structure
5. Install npm dependencies
6. Prompt for configuration details

### Step 3: Provide Configuration

When prompted, enter:

- **Mimir ROSS Folder ID**: UUID of your ROSS folder (e.g., `f082cd14-7d20-4538-aec3-ae01ba15c296`)
- **Mimir API Key**: Your Mimir API authentication token (e.g., `sakm.xxxx...`)
- **Server Port**: Local port for dashboard (default: 3000)

### Step 4: Copy Server Files

Copy all files from the package to the installation directory:

```bash
# Default installation directory
cp -r ./* ~/Mimir-ROSS-Server/
```

### Step 5: Start the Server

```bash
cd ~/Mimir-ROSS-Server
node mimir-webhook-server.js
```

The server will:
- Start on the configured port (default: http://localhost:3000)
- Create a Cloudflare Tunnel
- Display the tunnel URL for webhook configuration
- Begin monitoring the ROSS folder

---

## Manual Installation

If you prefer manual installation or need more control:

### 1. Install Dependencies

#### Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Install Node.js
```bash
brew install node
```

Verify installation:
```bash
node --version  # Should show v18.x or higher
npm --version   # Should show 9.x or higher
```

#### Install Cloudflare Tunnel
```bash
brew install cloudflared
```

### 2. Create Project Directory

```bash
mkdir -p ~/Mimir-ROSS-Server
cd ~/Mimir-ROSS-Server
```

### 3. Create Directory Structure

```bash
mkdir -p logs
mkdir -p ROSS_Images
mkdir -p public
```

### 4. Install npm Packages

Create `package.json`:

```json
{
  "name": "mimir-ross-webhook-server",
  "version": "1.0.0",
  "description": "Webhook server for Mimir ROSS folder synchronization",
  "main": "mimir-webhook-server.js",
  "scripts": {
    "start": "node mimir-webhook-server.js"
  },
  "keywords": ["mimir", "webhook", "sync"],
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0"
  }
}
```

Install dependencies:
```bash
npm install
```

### 5. Copy Server Files

Copy the following files to `~/Mimir-ROSS-Server/`:
- `mimir-webhook-server.js`
- `public/index.html`
- `public/styles.css`
- `public/app.js`

---

## Configuration

### Finding Your Mimir Credentials

#### ROSS Folder ID

1. Log in to Mimir at https://mimir.mjoll.no
2. Navigate to your ROSS folder
3. Copy the folder ID from the URL:
   ```
   https://mimir.mjoll.no/folders/[FOLDER-ID]
   ```

#### Mimir API Key

1. Go to Mimir Settings → API
2. Create or copy your API key
3. It should start with `sakm.`

### Configuration Methods

#### Option A: Environment Variables

Create a `.env` file:

```bash
ROSS_FOLDER_ID=your-folder-id-here
MIMIR_API_KEY=sakm.your-key-here
PORT=3000
```

#### Option B: Edit Server File

Edit `mimir-webhook-server.js` and update the CONFIG section:

```javascript
const CONFIG = {
  port: 3000,
  rossFolderId: 'your-folder-id-here',
  apiKey: 'sakm.your-key-here',
  mimirApiUrl: 'https://us.mjoll.no/api/v1',
  logFile: 'logs/mimir-ross.log',
  downloadDir: 'ROSS_Images',
  heartbeatInterval: 5
};
```

---

## Running the Server

### Start Server

```bash
cd ~/Mimir-ROSS-Server
node mimir-webhook-server.js
```

You should see output similar to:

```
🚀 Mimir webhook server running on port 3000
📝 Logs: /Users/username/Mimir-ROSS-Server/logs/mimir-ross.log
🖼️  Downloads: /Users/username/Mimir-ROSS-Server/ROSS_Images

📡 Webhook endpoint: http://localhost:3000/webhook/mimir-ross
🏥 Health check: http://localhost:3000/health

[TUNNEL] Starting Cloudflare Tunnel...
[TUNNEL] Tunnel URL: https://example-url.trycloudflare.com
[WEBHOOK] Updated existing webhook URL: https://example-url.trycloudflare.com/webhook/mimir-ross
```

### Configure Mimir Webhook

The server automatically updates the Mimir webhook configuration. Verify in Mimir:

1. Go to https://mimir.mjoll.no → Settings → Webhooks
2. Confirm the webhook URL matches the tunnel URL shown in server logs
3. Webhook should be active for "Item Creation" events

### Access Dashboard

Open your browser to:
```
http://localhost:3000
```

You'll see the Ouest-France | Novo 19 ROSS Manager dashboard with:
- Real-time server status
- Cloudflare Tunnel status
- Webhook sync status
- Live logs
- File counts and storage info
- Action buttons (Upload to Mimir, Sync, etc.)

---

## Running in Production

### Using PM2 (Recommended)

PM2 is a production process manager for Node.js:

#### Install PM2

```bash
npm install -g pm2
```

#### Start with PM2

```bash
cd ~/Mimir-ROSS-Server
pm2 start mimir-webhook-server.js --name mimir-webhook
```

#### Manage Process

```bash
# View logs
pm2 logs mimir-webhook

# Stop server
pm2 stop mimir-webhook

# Restart server
pm2 restart mimir-webhook

# View status
pm2 status
```

#### Auto-start on System Boot

```bash
pm2 startup
pm2 save
```

This ensures the server starts automatically when the Mac boots.

### Using macOS LaunchAgent

Create a LaunchAgent to run the server on login:

```bash
cat > ~/Library/LaunchAgents/com.ouestfrance.mimir-webhook.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ouestfrance.mimir-webhook</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/YOUR_USERNAME/Mimir-ROSS-Server/mimir-webhook-server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/Mimir-ROSS-Server/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/Mimir-ROSS-Server/logs/stderr.log</string>
</dict>
</plist>
EOF
```

Replace `YOUR_USERNAME` with your macOS username.

Load the agent:
```bash
launchctl load ~/Library/LaunchAgents/com.ouestfrance.mimir-webhook.plist
```

---

## Usage

### Uploading Files to Mimir

1. Open dashboard at http://localhost:3000
2. Go to **Actions** tab
3. Click **Upload to Mimir**
4. Drag and drop files in the Mimir web interface
5. Files automatically download to `ROSS_Images/` folder

### Monitoring Sync

- **Dashboard Tab**: View real-time server status and stats
- **Live Logs**: See webhook events and file operations
- **Mimir Webhook Status**: Green dot indicates active sync

### Managing Server

Use the Actions tab to:
- **Sync All Files**: Manually trigger full sync
- **View Downloaded Files**: Browse local files
- **Restart Server**: Restart the Node.js server
- **Clear Logs**: Clear log history

### Configuration Tab

Update settings:
- Folder Name and ID
- API Key
- Download Directory
- Server Port
- Heartbeat Interval
- Cloudflare Tunnel controls

---

## Troubleshooting

### Server Won't Start

**Check port availability:**
```bash
lsof -i :3000
```

If port is in use, either:
- Stop the other process
- Change port in configuration

**Check Node.js:**
```bash
node --version
npm --version
```

Should show Node v18+ and npm 9+.

### Webhook Not Receiving

1. Check server logs for errors
2. Verify Cloudflare Tunnel is running (green status in dashboard)
3. Check Mimir webhook configuration matches tunnel URL
4. Test health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

### Files Not Downloading

1. Check API key is valid
2. Verify folder ID is correct
3. Check `ROSS_Images/` directory permissions:
   ```bash
   ls -la ~/Mimir-ROSS-Server/ROSS_Images
   ```
4. Review logs in dashboard or:
   ```bash
   tail -f ~/Mimir-ROSS-Server/logs/mimir-ross.log
   ```

### Cloudflare Tunnel Issues

**Restart tunnel:**
1. Go to Configuration tab in dashboard
2. Click "Stop Tunnel"
3. Click "Start Tunnel"

**Check cloudflared:**
```bash
cloudflared --version
```

If not found:
```bash
brew install cloudflared
```

---

## File Locations

```
~/Mimir-ROSS-Server/
├── mimir-webhook-server.js          # Main server
├── package.json                      # Dependencies
├── node_modules/                     # Installed packages
├── public/                           # Web dashboard
│   ├── index.html                    # Dashboard HTML
│   ├── styles.css                    # Styles
│   └── app.js                        # Dashboard JavaScript
├── logs/
│   └── mimir-ross.log               # Server logs
├── ROSS_Images/                     # Downloaded files
└── config.json                      # Configuration (if using file config)
```

---

## Security Notes

### API Key Protection

- Never commit `config.json` or `.env` to version control
- Store API keys securely
- Use environment variables in production

### Firewall

The server only needs:
- Outbound HTTPS (443) for Mimir API
- Outbound HTTP/HTTPS for Cloudflare Tunnel
- Local port (default 3000) for dashboard access

### File Permissions

Ensure `ROSS_Images/` directory has appropriate permissions:

```bash
chmod 755 ~/Mimir-ROSS-Server/ROSS_Images
```

---

## Support

### Logs

Check server logs for detailed information:

```bash
tail -f ~/Mimir-ROSS-Server/logs/mimir-ross.log
```

Or view live in dashboard.

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Change PORT in config or kill process using `lsof -ti:3000 \| xargs kill` |
| API authentication failed | Verify API key in Mimir settings |
| Files not syncing | Check folder ID and webhook configuration |
| Tunnel connection failed | Restart server or check internet connection |

### Getting Help

Contact your system administrator or the development team with:
- Server logs (`logs/mimir-ross.log`)
- Configuration (without API key)
- Screenshot of dashboard
- Description of issue

---

## Updating

To update the server:

1. Stop the server:
   ```bash
   pm2 stop mimir-webhook  # If using PM2
   ```

2. Backup current installation:
   ```bash
   cp -r ~/Mimir-ROSS-Server ~/Mimir-ROSS-Server-backup
   ```

3. Replace server files with new versions

4. Update dependencies:
   ```bash
   cd ~/Mimir-ROSS-Server
   npm install
   ```

5. Restart server:
   ```bash
   pm2 restart mimir-webhook  # If using PM2
   ```

---

## Uninstallation

To remove the server:

1. Stop the server:
   ```bash
   pm2 delete mimir-webhook  # If using PM2
   ```

2. Remove LaunchAgent (if configured):
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.ouestfrance.mimir-webhook.plist
   rm ~/Library/LaunchAgents/com.ouestfrance.mimir-webhook.plist
   ```

3. Remove installation directory:
   ```bash
   rm -rf ~/Mimir-ROSS-Server
   ```

---

## Technical Specifications

- **Language**: Node.js (JavaScript)
- **Dependencies**: Express.js, Axios
- **External Services**: Mimir API, Cloudflare Tunnel
- **Database**: None (file-based logging)
- **Architecture**: Single-threaded Node.js server
- **Memory Usage**: ~30-50MB
- **Disk Usage**: ~20MB + downloaded files

---

**Version**: 1.0
**Last Updated**: November 2025
**Maintained By**: Ouest-France IT Team
