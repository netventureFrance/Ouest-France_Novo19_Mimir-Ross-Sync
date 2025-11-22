# Mimir ROSS Folder Webhook Monitor

Simple Node.js webhook server for monitoring the ROSS folder in Mimir.

## 🚀 Quick Start

### 1. Start the server
```bash
node mimir-webhook-server.js
```

### 2. Expose to internet
```bash
ngrok http 3000
```

### 3. Configure Mimir webhook
- Go to https://mimir.mjoll.no/ → Settings → Webhooks
- Set URL to: `https://your-ngrok-url/webhook/mimir-ross`

### 4. Monitor logs
```bash
./scripts/monitor-logs.sh
```

## 📁 Structure

```
Ross-Folder/
├── mimir-webhook-server.js       # Main webhook server
├── package.json                  # Dependencies
├── WEBHOOK-SERVER-GUIDE.md       # Detailed guide
│
├── scripts/
│   ├── start-webhook-server.sh   # Start server
│   └── monitor-logs.sh           # Monitor logs
│
├── logs/
│   └── mimir-ross.log            # Activity log
│
└── ROSS_Images/                  # Downloaded files (future)
```

## 🔧 Configuration

Edit `mimir-webhook-server.js` (lines 9-15):

```javascript
const CONFIG = {
  port: 3000,                              // Server port
  rossFolderId: 'f082cd14-7d20-....',      // ROSS folder ID
  apiKey: 'sakm.mKb1InvxUBCWs....',        // Mimir API key
  logFile: 'logs/mimir-ross.log',          // Log file
  downloadDir: 'ROSS_Images'               // Downloads
};
```

## 📊 What It Does

When a file is uploaded to ROSS folder:
1. ✅ Receives webhook from Mimir
2. ✅ Fetches item details via API
3. ✅ Checks if in ROSS folder
4. ✅ Logs to file with timestamp
5. ✅ Shows folder summary

## 📝 Monitoring

**Real-time logs:**
```bash
tail -f logs/mimir-ross.log
```

**Last 50 entries:**
```bash
tail -50 logs/mimir-ross.log
```

**Search logs:**
```bash
grep "NEW ITEM" logs/mimir-ross.log
```

## 🏃 Running in Background

**Using pm2 (recommended):**
```bash
npm install -g pm2
pm2 start mimir-webhook-server.js --name mimir-webhook
pm2 logs mimir-webhook
pm2 save
```

**Using nohup:**
```bash
nohup node mimir-webhook-server.js > server.log 2>&1 &
```

## 🧪 Testing

**Health check:**
```bash
curl http://localhost:3000/health
```

**Test webhook:**
```bash
curl -X POST http://localhost:3000/webhook/mimir-ross \
  -H "Content-Type: application/json" \
  -d '{"event":"item_created","item":{"id":"test","itemType":"image"}}'
```

## 📚 Documentation

See **WEBHOOK-SERVER-GUIDE.md** for:
- Complete setup instructions
- Extending functionality
- Adding notifications (Slack, email)
- Troubleshooting

## ⚙️ Requirements

- Node.js v25.2.1+ (installed)
- npm v11.6.2+ (installed)
- ngrok (for webhooks)

## 🔑 Key Info

- **Mimir Tenant**: https://mimir.mjoll.no/
- **ROSS Folder ID**: `f082cd14-7d20-4538-aec3-ae01ba15c296`
- **Webhook Path**: `/webhook/mimir-ross`
- **Server Port**: 3000

---

**Simple, fast, and effective.** 🎯
