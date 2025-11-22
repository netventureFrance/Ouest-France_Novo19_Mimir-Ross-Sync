# Mimir Webhook Server - Simple Alternative to n8n

A lightweight Node.js server that monitors the Mimir ROSS folder via webhooks.

## Why This Instead of n8n?

✅ **Simpler**: Single 200-line JavaScript file
✅ **Lighter**: ~10MB vs n8n's ~500MB
✅ **Faster**: Starts in <1 second
✅ **Easier**: No import/export/activation needed
✅ **Debuggable**: Clear console output and logs
✅ **Reliable**: No GUI complexity

## Quick Start

### 1. Install Dependencies

```bash
cd /Users/yheydlauf/Claude_Code_Yan/Mimir/Ouest-France/Ross-Folder
npm install
```

### 2. Start the Server

```bash
./scripts/start-webhook-server.sh
```

Or directly:
```bash
node mimir-webhook-server.js
```

You should see:
```
🚀 Mimir webhook server running on port 5678
📝 Logs: /Users/yheydlauf/.../logs/mimir-ross.log
🖼️  Downloads: /Users/yheydlauf/.../ROSS_Images

📡 Webhook endpoint: http://localhost:5678/webhook/mimir-ross
🏥 Health check: http://localhost:5678/health
```

### 3. Expose to Internet (for Mimir webhooks)

```bash
ngrok http 5678
```

Copy the ngrok URL (e.g., `https://abc123.ngrok-free.dev`)

### 4. Configure Mimir Webhook

1. Go to https://mimir.mjoll.no/ → Settings → Webhooks
2. Update webhook URL to: `https://your-ngrok-url/webhook/mimir-ross`
3. Save

### 5. Test It

Upload a file to the ROSS folder in Mimir and watch the console!

## What It Does

When a file is uploaded to ROSS folder:

1. **Receives webhook** from Mimir
2. **Fetches full item details** via API
3. **Checks if in ROSS folder**
4. **Logs to file**:
   - 📥 Webhook received
   - ✅ New item details
   - 📊 Folder summary
5. **(Optional) Downloads file** to `ROSS_Images/`

## Monitoring Logs

**Watch logs in real-time:**
```bash
./scripts/monitor-logs.sh
```

Or manually:
```bash
tail -f logs/mimir-ross.log
```

## Configuration

Edit `mimir-webhook-server.js` (top section):

```javascript
const CONFIG = {
  port: 5678,                              // Server port
  rossFolderId: 'f082cd14-7d20-....',      // ROSS folder ID
  apiKey: 'sakm.mKb1InvxUBCWs....',        // Mimir API key
  logFile: 'logs/mimir-ross.log',          // Log file path
  downloadDir: 'ROSS_Images'               // Download directory
};
```

## Running in Background

### Option 1: Using `pm2` (Recommended for Production)

```bash
# Install pm2 globally
npm install -g pm2

# Start server with pm2
pm2 start mimir-webhook-server.js --name mimir-webhook

# View logs
pm2 logs mimir-webhook

# Stop server
pm2 stop mimir-webhook

# Restart server
pm2 restart mimir-webhook

# Auto-start on system reboot
pm2 startup
pm2 save
```

### Option 2: Using `nohup`

```bash
nohup node mimir-webhook-server.js > server.log 2>&1 &
```

### Option 3: Using `screen`

```bash
screen -S mimir-webhook
node mimir-webhook-server.js
# Press Ctrl+A then D to detach
# Reattach with: screen -r mimir-webhook
```

## Testing

### Test health endpoint:
```bash
curl http://localhost:5678/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-22T..."}
```

### Test webhook manually:
```bash
curl -X POST http://localhost:5678/webhook/mimir-ross \
  -H "Content-Type: application/json" \
  -d '{
    "event": "item_created",
    "item": {
      "id": "test-123",
      "itemType": "image"
    }
  }'
```

## Troubleshooting

### Server won't start

**Check if port is in use:**
```bash
lsof -i :5678
```

**Kill existing process:**
```bash
kill -9 <PID>
```

Or change the port in `mimir-webhook-server.js`.

### Logs not appearing

Check file permissions:
```bash
ls -la logs/mimir-ross.log
chmod 644 logs/mimir-ross.log
```

### Webhook not receiving

1. Check server is running: `curl http://localhost:5678/health`
2. Check ngrok is running: `curl https://your-ngrok-url/health`
3. Check Mimir webhook configuration
4. Check server logs for errors

## Advantages Over n8n

| Feature | This Server | n8n |
|---------|------------|-----|
| **File size** | ~200 lines | Thousands of files |
| **Memory** | ~30MB | ~200MB+ |
| **Startup time** | <1 second | ~10 seconds |
| **Dependencies** | 2 (express, axios) | 100+ |
| **Debugging** | Console + logs | GUI + logs |
| **Modifications** | Edit JS file | Import/export workflows |
| **Complexity** | Single file | Multi-file, database |

## Extending Functionality

### Add file downloads

The `downloadFile()` function is already included. To enable automatic downloads, uncomment this line in the webhook handler:

```javascript
// After logging folder summary, add:
await downloadFile(fullItem);
```

### Add Slack notifications

```bash
npm install @slack/webhook
```

Then in the webhook handler:
```javascript
const { IncomingWebhook } = require('@slack/webhook');
const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

await webhook.send({
  text: `📥 New item in ROSS: ${title}`
});
```

### Add email notifications

```bash
npm install nodemailer
```

### Add database storage

```bash
npm install sqlite3
# or
npm install pg  # for PostgreSQL
```

## Comparison with n8n

**Use this simple server if:**
- ✅ Simple webhook → log workflow
- ✅ Want lightweight solution
- ✅ Comfortable with code
- ✅ Need easy debugging

**Use n8n if:**
- ✅ Complex multi-step workflows
- ✅ Connecting many services (50+ integrations)
- ✅ Non-technical users need to modify
- ✅ Need visual workflow editor

## Files Created

```
Ross-Folder/
├── mimir-webhook-server.js       # Main server (200 lines)
├── package.json                  # Dependencies
├── scripts/
│   └── start-webhook-server.sh   # Start script
└── logs/
    └── mimir-ross.log            # Activity log
```

---

**You're all set!** Start the server and watch webhooks flow in. 🚀
