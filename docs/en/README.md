# Mimir ROSS Webhook Server

**Ouest-France | Novo 19 - Graphics Assets Manager**

A lightweight Node.js webhook server for bidirectional synchronization between Mimir's ROSS folder and local macOS storage, with a web-based management dashboard.

---

## Quick Start

### For End Users

1. **Extract** the installation package to your desired location
2. **Run** the installation script:
   ```bash
   ./install.sh
   ```
3. **Follow** the prompts to configure your Mimir credentials
4. **Start** the server:
   ```bash
   node mimir-webhook-server.js
   ```
5. **Access** the dashboard at http://localhost:3000

### For System Administrators

See **[INSTALLATION.md](./INSTALLATION.md)** for comprehensive deployment instructions.

---

## What It Does

- ✅ **Automatic Downloads**: Files uploaded to Mimir → automatically synced to local directory
- ✅ **Upload Integration**: Quick access to upload files via Mimir web interface
- ✅ **Web Dashboard**: Real-time monitoring, logs, and management
- ✅ **Cloudflare Tunnel**: Secure automatic tunnel for webhook connectivity
- ✅ **File Cleanup**: Automatically removes local files deleted from Mimir

---

## System Requirements

- macOS 10.14 or later
- Internet connection
- Mimir account with API access

---

## Features

### Dashboard (http://localhost:3000)

**Monitor Tab**
- Server status and uptime
- Cloudflare Tunnel status
- Webhook sync indicator
- File counts and storage usage
- Live server logs

**Actions Tab**
- Upload to Mimir (opens Mimir web interface)
- Sync all files manually
- View downloaded files
- Restart server
- Clear logs

**Configuration Tab**
- Manage Cloudflare Tunnel
- Configure folder ID and API key
- Set download directory
- Adjust heartbeat interval

---

## Documentation

- **[README.md](./README.md)** - This quick start guide
- **[INSTALLATION.md](./INSTALLATION.md)** - Complete installation and configuration guide

---

**Version**: 1.0 | **Release**: November 2025 | **Platform**: macOS 10.14+
