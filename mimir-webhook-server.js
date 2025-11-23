#!/usr/bin/env node

const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
let CONFIG = {
  port: 3000,
  mimirApiUrl: 'https://mimir.mjoll.no/api/v1',
  apiKey: 'sakm.mKb1InvxUBCWscejsXGFC._DM1yHTiYUEsPlMIzaLyy',
  rossFolderId: 'f082cd14-7d20-4538-aec3-ae01ba15c296',
  logFile: path.join(__dirname, 'logs', 'mimir-ross.log'),
  downloadDir: path.join(__dirname, 'ROSS_Images'),
  heartbeatInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
  syncInterval: 30 * 60 * 1000, // 30 minutes in milliseconds - auto-sync moved files
  publicUrl: '' // Public URL for webhooks (e.g., Cloudflare Tunnel)
};

// Cloudflare Tunnel management
let tunnelProcess = null;
let tunnelUrl = null;

// Webhook sync status
let webhookSyncStatus = {
  synced: false,
  lastUpdate: null,
  error: null
};

// Load config from file if exists
async function loadConfigFromFile() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const savedConfig = JSON.parse(configData);

    // Merge saved config with defaults
    if (savedConfig.rossFolderId) CONFIG.rossFolderId = savedConfig.rossFolderId;
    if (savedConfig.apiKey) CONFIG.apiKey = savedConfig.apiKey;
    if (savedConfig.downloadDir) {
      // Handle both absolute and relative paths
      CONFIG.downloadDir = path.isAbsolute(savedConfig.downloadDir)
        ? savedConfig.downloadDir
        : path.join(__dirname, savedConfig.downloadDir);
    }
    if (savedConfig.port) CONFIG.port = savedConfig.port;
    if (savedConfig.publicUrl !== undefined) CONFIG.publicUrl = savedConfig.publicUrl;
    if (savedConfig.heartbeatInterval) CONFIG.heartbeatInterval = savedConfig.heartbeatInterval;
    if (savedConfig.syncInterval) CONFIG.syncInterval = savedConfig.syncInterval;
  } catch (error) {
    // Config file doesn't exist or is invalid, use defaults
  }
}

// Track heartbeat and sync intervals for updates
let heartbeatIntervalId = null;
let syncIntervalId = null;

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Store server start time for uptime calculation
const serverStartTime = Date.now();

// Log to file helper
async function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;

  try {
    await fs.appendFile(CONFIG.logFile, logEntry);
    console.log(logEntry.trim());
  } catch (error) {
    console.error('Failed to write to log:', error);
  }
}

// Fetch item details from Mimir API
async function getItemDetails(itemId) {
  try {
    const response = await axios.get(`${CONFIG.mimirApiUrl}/items/${itemId}`, {
      headers: {
        'x-mimir-cognito-id-token': `Bearer ${CONFIG.apiKey}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch item details:', error.message);
    throw error;
  }
}

// Get folder details
async function getFolderDetails(folderId) {
  try {
    const response = await axios.get(`${CONFIG.mimirApiUrl}/folders/${folderId}`, {
      headers: {
        'x-mimir-cognito-id-token': `Bearer ${CONFIG.apiKey}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch folder details:', error.message);
    throw error;
  }
}

// Get folder contents
async function getFolderContents(folderId) {
  try {
    const response = await axios.get(`${CONFIG.mimirApiUrl}/folders/${folderId}/content`, {
      headers: {
        'x-mimir-cognito-id-token': `Bearer ${CONFIG.apiKey}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch folder contents:', error.message);
    throw error;
  }
}

// Helper function to sanitize filenames
function sanitizeFilename(filename) {
  if (!filename) return 'untitled';
  return filename.replace(/[^a-z0-9_\-\.]/gi, '_');
}

// Upload file to Mimir ROSS folder using multi-step workflow
async function uploadFileToMimir(filePath, filename) {
  try {
    await logToFile(`[UPLOAD] Starting upload for ${filename}...`);

    const stats = fsSync.statSync(filePath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    const fileSize = stats.size;

    // Step 1: Create item entry (metadata)
    await logToFile(`[UPLOAD] Step 1/5 - Creating item entry...`);
    const createItemResponse = await axios.post(
      `${CONFIG.mimirApiUrl}/items`,
      {
        originalFileName: filename,
        mediaSize: fileSize,
        itemType: getFileType(filename)
      },
      {
        headers: {
          'x-mimir-cognito-id-token': `Bearer ${CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const itemId = createItemResponse.data.id;
    await logToFile(`[UPLOAD] Created item ${itemId}`);

    // Step 2: Request signed upload URL
    await logToFile(`[UPLOAD] Step 2/5 - Requesting upload URL...`);
    const uploadUrlResponse = await axios.post(
      `${CONFIG.mimirApiUrl}/items/${itemId}/upload/multipart`,
      {
        parts: 1, // Single part for small files
        fileName: filename
      },
      {
        headers: {
          'x-mimir-cognito-id-token': `Bearer ${CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const uploadUrl = uploadUrlResponse.data.urls?.[0] || uploadUrlResponse.data.url;
    const uploadId = uploadUrlResponse.data.uploadId;

    if (!uploadUrl) {
      throw new Error('No upload URL received from Mimir');
    }

    await logToFile(`[UPLOAD] Step 3/5 - Uploading file (${fileSizeMB} MB)...`);

    // Step 3: Upload file to presigned URL
    const fileBuffer = fsSync.readFileSync(filePath);
    const uploadResponse = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const etag = uploadResponse.headers.etag;

    // Step 4: Complete multipart upload
    await logToFile(`[UPLOAD] Step 4/5 - Completing upload...`);
    await axios.post(
      `${CONFIG.mimirApiUrl}/items/${itemId}/upload/multipart/complete`,
      {
        parts: [{
          ETag: etag,
          PartNumber: 1
        }]
      },
      {
        headers: {
          'x-mimir-cognito-id-token': `Bearer ${CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Step 5: Add item to ROSS folder
    await logToFile(`[UPLOAD] Step 5/5 - Adding to ROSS folder...`);
    await axios.put(
      `${CONFIG.mimirApiUrl}/folders/${CONFIG.rossFolderId}/content`,
      {
        items: [itemId]
      },
      {
        headers: {
          'x-mimir-cognito-id-token': `Bearer ${CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    await logToFile(`[UPLOAD] ✓ Success - ${filename} (${fileSizeMB} MB) → Mimir ID: ${itemId}`);
    return true;

  } catch (error) {
    await logToFile(`[UPLOAD] ✗ Failed - ${filename}: ${error.message}`);
    if (error.response) {
      await logToFile(`[UPLOAD] Error details: ${JSON.stringify(error.response.data)}`);
      await logToFile(`[UPLOAD] Status: ${error.response.status}`);
    }
    return false;
  }
}

// Helper function to determine file type from extension
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'];
  const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
  const docExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (docExts.includes(ext)) return 'document';
  return 'other';
}

// Download file from Mimir
async function downloadFile(item) {
  if (!item.highRes) {
    await logToFile(`[WARN] No download URL for item ${item.id}`);
    return false;
  }

  try {
    const fileName = item.originalFileName || `${item.id}.${item.itemType}`;
    const safeFileName = sanitizeFilename(fileName);
    const filePath = path.join(CONFIG.downloadDir, safeFileName);

    // Check if file already exists
    const fsSync = require('fs');
    if (fsSync.existsSync(filePath)) {
      await logToFile(`[SKIP] File already exists: ${safeFileName}`);
      return true;
    }

    const response = await axios.get(item.highRes, { responseType: 'stream' });
    const writer = fsSync.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', async () => {
        const size = (item.mediaSize / 1024 / 1024).toFixed(2);
        await logToFile(`[DOWNLOAD] "${item.title || fileName}" (${size} MB) → ${safeFileName}`);
        resolve(true);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    await logToFile(`[ERROR] Download failed - ${item.id}: ${error.message}`);
    return false;
  }
}

// Sync all existing files from ROSS folder
async function syncAllFiles() {
  try {
    await logToFile('[SYNC] Starting download of all existing files from ROSS folder...');

    const folderData = await getFolderContents(CONFIG.rossFolderId);
    const items = folderData.hits || [];
    const totalItems = items.length;

    await logToFile(`[SYNC] Found ${totalItems} items in ROSS folder`);

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    // Build set of expected filenames from Mimir
    const mimirFilenames = new Set();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemDetails = await getItemDetails(item.id);

      // Track the expected filename
      const fileName = sanitizeFilename(itemDetails.title);
      mimirFilenames.add(fileName);

      const result = await downloadFile(itemDetails);

      if (result === true) {
        if (itemDetails.highRes) {
          downloaded++;
        } else {
          skipped++;
        }
      } else {
        failed++;
      }
    }

    // Clean up local files that no longer exist in Mimir
    let deleted = 0;
    try {
      if (fsSync.existsSync(CONFIG.downloadDir)) {
        const localFiles = fsSync.readdirSync(CONFIG.downloadDir);

        for (const localFile of localFiles) {
          // Skip hidden files and directories
          if (localFile.startsWith('.')) continue;

          const filePath = path.join(CONFIG.downloadDir, localFile);
          const stats = fsSync.statSync(filePath);

          // Only check files, not directories
          if (stats.isFile() && !mimirFilenames.has(localFile)) {
            await logToFile(`[CLEANUP] Deleting local file not in Mimir: ${localFile}`);
            fsSync.unlinkSync(filePath);
            deleted++;
          }
        }
      }
    } catch (error) {
      await logToFile(`[ERROR] Cleanup failed: ${error.message}`);
    }

    await logToFile(`[SYNC] Completed - Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}, Deleted: ${deleted}`);
    await logToFile('='.repeat(80));
  } catch (error) {
    await logToFile(`[ERROR] Sync failed - ${error.message}`);
  }
}

// Monitor local ROSS_Images folder for changes
function monitorLocalFolder() {
  try {
    // Track file stats to detect actual changes
    const fileStats = new Map();

    // Initial scan
    const files = fsSync.readdirSync(CONFIG.downloadDir);
    files.forEach(file => {
      const filePath = path.join(CONFIG.downloadDir, file);
      const stats = fsSync.statSync(filePath);
      if (stats.isFile()) {
        fileStats.set(file, {
          size: stats.size,
          mtime: stats.mtimeMs
        });
      }
    });

    logToFile(`[MONITOR] Watching ${CONFIG.downloadDir} for changes...`);

    fsSync.watch(CONFIG.downloadDir, async (eventType, filename) => {
      if (!filename) return;

      const filePath = path.join(CONFIG.downloadDir, filename);

      // Skip temporary files and hidden files
      if (filename.startsWith('.') || filename.endsWith('.tmp')) {
        return;
      }

      try {
        // Check if file still exists (could be deleted)
        if (!fsSync.existsSync(filePath)) {
          if (fileStats.has(filename)) {
            await logToFile(`[FILE] Deleted - ${filename}`);
            fileStats.delete(filename);
          }
          return;
        }

        const stats = fsSync.statSync(filePath);

        if (!stats.isFile()) return;

        const previousStats = fileStats.get(filename);

        if (!previousStats) {
          // New file detected - upload to Mimir
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          await logToFile(`[FILE] Added - ${filename} (${sizeMB} MB)`);
          fileStats.set(filename, {
            size: stats.size,
            mtime: stats.mtimeMs
          });

          // Wait a moment to ensure file is fully written
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Upload to Mimir ROSS folder
          if (fsSync.existsSync(filePath)) {
            await uploadFileToMimir(filePath, filename);
          }

        } else if (stats.mtimeMs !== previousStats.mtime || stats.size !== previousStats.size) {
          // Modified file
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          await logToFile(`[FILE] Modified - ${filename} (${sizeMB} MB)`);
          fileStats.set(filename, {
            size: stats.size,
            mtime: stats.mtimeMs
          });
        }
      } catch (error) {
        // File might be in the process of being written, ignore
      }
    });

  } catch (error) {
    console.error('Failed to start folder monitor:', error.message);
  }
}

// Main webhook handler
app.post('/webhook/mimir-ross', async (req, res) => {
  try {
    const { event, item } = req.body;

    // Only process item_created events (Mimir only supports Item Creation webhooks)
    if (event !== 'item_created') {
      await logToFile(`[SKIP] Event '${event}' ignored (only item_created is supported by Mimir)`);
      return res.json({ status: 'ignored', event });
    }

    await logToFile(`[WEBHOOK] New item: ${item.id} (${item.itemType})`);

    // Fetch full item details
    const fullItem = await getItemDetails(item.id);

    // Check if item is in ROSS folder
    const folderParents = fullItem.folderParents || [];
    const isInRossFolder = folderParents.includes(CONFIG.rossFolderId);

    if (!isInRossFolder) {
      await logToFile(`[SKIP] Item ${item.id} not in ROSS folder`);
      return res.json({ status: 'skipped', message: 'Not in ROSS folder' });
    }

    // Item is in ROSS folder
    const title = fullItem.metadata?.formData?.default_title || fullItem.originalFileName || 'Untitled';
    const fileSize = fullItem.mediaSize ? `${(fullItem.mediaSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown';

    await logToFile(`[ROSS] New item - "${title}" (${fullItem.itemType}) - ${fileSize} - ID: ${item.id}`);

    // Get folder contents and log summary
    const folderData = await getFolderContents(CONFIG.rossFolderId);
    const totalItems = folderData.total || 0;
    const items = folderData.hits || [];

    // Count by type
    const itemTypes = items.reduce((acc, item) => {
      const type = item.itemType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const typesSummary = Object.entries(itemTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    await logToFile(`[FOLDER] Summary - Total: ${totalItems} (${typesSummary})`);

    // Log first 10 items
    for (let i = 0; i < Math.min(10, items.length); i++) {
      const item = items[i];
      const name = item.metadata?.formData?.default_title || item.originalFileName || 'Untitled';
      const size = item.mediaSize ? `${(item.mediaSize / 1024 / 1024).toFixed(2)} MB` : '?';
      await logToFile(`   ${i + 1}. [${item.itemType}] ${name} (${size})`);
    }

    await logToFile('='.repeat(80));

    // Download file automatically
    await downloadFile(fullItem);

    res.json({
      status: 'success',
      message: 'Item processed',
      itemId: item.id,
      title,
      totalItems
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    await logToFile(`[ERROR] ${error.message}`);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Start Cloudflare Tunnel
app.post('/api/tunnel/start', async (req, res) => {
  try {
    if (tunnelProcess) {
      return res.json({
        status: 'error',
        message: 'Tunnel is already running'
      });
    }

    await logToFile('[TUNNEL] Starting Cloudflare Tunnel...');

    tunnelProcess = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${CONFIG.port}`]);
    tunnelUrl = null;

    // Capture output to extract the tunnel URL
    tunnelProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[TUNNEL]', output);

      // Look for the tunnel URL in the output
      const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (urlMatch && !tunnelUrl) {
        tunnelUrl = urlMatch[0];
        CONFIG.publicUrl = tunnelUrl;
        logToFile(`[TUNNEL] Tunnel URL: ${tunnelUrl}`);
      }
    });

    tunnelProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error('[TUNNEL ERROR]', output);

      // Look for the tunnel URL in stderr (cloudflared outputs to stderr)
      const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (urlMatch && !tunnelUrl) {
        tunnelUrl = urlMatch[0];
        CONFIG.publicUrl = tunnelUrl;
        logToFile(`[TUNNEL] Tunnel URL: ${tunnelUrl}`);
      }
    });

    tunnelProcess.on('close', (code) => {
      logToFile(`[TUNNEL] Tunnel process closed with code ${code}`);
      tunnelProcess = null;
      tunnelUrl = null;
    });

    // Wait a bit for the tunnel to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    res.json({
      status: 'ok',
      message: 'Tunnel starting...',
      url: tunnelUrl
    });
  } catch (error) {
    await logToFile(`[ERROR] Failed to start tunnel: ${error.message}`);
    res.json({
      status: 'error',
      message: error.message
    });
  }
});

// API: Stop Cloudflare Tunnel
app.post('/api/tunnel/stop', async (req, res) => {
  try {
    if (!tunnelProcess) {
      return res.json({
        status: 'error',
        message: 'No tunnel is running'
      });
    }

    await logToFile('[TUNNEL] Stopping Cloudflare Tunnel...');
    tunnelProcess.kill();
    tunnelProcess = null;
    tunnelUrl = null;
    CONFIG.publicUrl = '';

    res.json({
      status: 'ok',
      message: 'Tunnel stopped'
    });
  } catch (error) {
    await logToFile(`[ERROR] Failed to stop tunnel: ${error.message}`);
    res.json({
      status: 'error',
      message: error.message
    });
  }
});

// API: Get Tunnel Status
app.get('/api/tunnel/status', async (req, res) => {
  res.json({
    status: 'ok',
    running: !!tunnelProcess,
    url: tunnelUrl
  });
});

// API: Sync folder name from Mimir
app.post('/api/sync-folder-name', async (req, res) => {
  try {
    const folderUrl = `${CONFIG.mimirApiUrl}/folders/${CONFIG.rossFolderId}`;
    const response = await axios.get(folderUrl, {
      headers: { 'Authorization': `Bearer ${CONFIG.apiKey}` }
    });

    const folderName = response.data.name || 'Unknown';

    // Update config with the folder name
    CONFIG.rossFolderName = folderName;

    // Save to config file
    const savedConfig = JSON.parse(fsSync.readFileSync(configFile, 'utf8'));
    savedConfig.rossFolderName = folderName;
    fsSync.writeFileSync(configFile, JSON.stringify(savedConfig, null, 2));

    await logToFile(`[SYNC] Folder name synced: ${folderName}`);

    res.json({
      status: 'ok',
      folderName: folderName
    });
  } catch (error) {
    const errorMsg = error.response?.status === 401
      ? 'Invalid API key or folder ID'
      : 'Failed to fetch folder name from Mimir';

    await logToFile(`[ERROR] Folder name sync failed: ${errorMsg}`);

    res.json({
      status: 'error',
      message: errorMsg
    });
  }
});

// API: Browse directories
app.get('/api/browse', async (req, res) => {
  try {
    const currentPath = req.query.path || require('os').homedir();
    const items = [];

    // Add parent directory option if not at root
    const parentPath = path.dirname(currentPath);
    if (currentPath !== parentPath) {
      items.push({
        name: '..',
        path: parentPath,
        type: 'parent'
      });
    }

    // List directories in current path
    const files = await fs.readdir(currentPath);
    for (const file of files) {
      try {
        const fullPath = path.join(currentPath, file);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          items.push({
            name: file,
            path: fullPath,
            type: 'directory'
          });
        }
      } catch (e) {
        // Skip files we can't access
      }
    }

    res.json({
      currentPath,
      items: items.sort((a, b) => {
        if (a.type === 'parent') return -1;
        if (b.type === 'parent') return 1;
        return a.name.localeCompare(b.name);
      })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get current configuration
app.get('/api/config', async (req, res) => {
  try {
    let rossFolderName = '';
    try {
      const folderDetails = await getFolderDetails(CONFIG.rossFolderId);
      // Try multiple possible fields for the folder name
      rossFolderName = folderDetails.name ||
                      folderDetails.title ||
                      folderDetails.folderName ||
                      folderDetails.metadata?.formData?.default_title ||
                      '';

      // Log the folder details for debugging
      console.log('[DEBUG] Folder details:', JSON.stringify(folderDetails, null, 2));
    } catch (e) {
      console.error('[DEBUG] Failed to fetch folder name:', e.message);
      // Folder name fetch failed, leave empty
    }

    res.json({
      rossFolderId: CONFIG.rossFolderId,
      rossFolderName: rossFolderName || 'Unknown',
      apiKey: CONFIG.apiKey.substring(0, 10) + '...',
      downloadDir: path.basename(CONFIG.downloadDir),
      downloadDirFull: CONFIG.downloadDir,
      port: CONFIG.port,
      publicUrl: CONFIG.publicUrl,
      heartbeatInterval: CONFIG.heartbeatInterval
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Save configuration
app.post('/api/config', async (req, res) => {
  try {
    const newConfig = req.body;
    const configPath = path.join(__dirname, 'config.json');

    // Log configuration changes
    const changes = [];

    if (newConfig.rossFolderId !== CONFIG.rossFolderId) {
      changes.push(`Folder ID: ${CONFIG.rossFolderId} → ${newConfig.rossFolderId}`);
      CONFIG.rossFolderId = newConfig.rossFolderId;
    }

    if (newConfig.apiKey !== CONFIG.apiKey) {
      changes.push(`API Key: Updated`);
      CONFIG.apiKey = newConfig.apiKey;
    }

    const newDownloadDir = path.isAbsolute(newConfig.downloadDir)
      ? newConfig.downloadDir
      : path.join(__dirname, newConfig.downloadDir);
    if (newDownloadDir !== CONFIG.downloadDir) {
      changes.push(`Download Directory: ${CONFIG.downloadDir} → ${newDownloadDir}`);
      CONFIG.downloadDir = newDownloadDir;

      // Create directory if it doesn't exist
      try {
        await fs.mkdir(CONFIG.downloadDir, { recursive: true });
      } catch (e) {
        // Directory already exists or can't be created
      }
    }

    if (newConfig.port !== CONFIG.port) {
      changes.push(`Port: ${CONFIG.port} → ${newConfig.port} (requires restart)`);
      CONFIG.port = newConfig.port;
    }

    if (newConfig.publicUrl !== CONFIG.publicUrl) {
      const oldUrl = CONFIG.publicUrl || '(none)';
      const newUrl = newConfig.publicUrl || '(none)';
      changes.push(`Public URL: ${oldUrl} → ${newUrl}`);
      CONFIG.publicUrl = newConfig.publicUrl;
    }

    if (newConfig.heartbeatInterval !== CONFIG.heartbeatInterval) {
      const oldMinutes = Math.floor(CONFIG.heartbeatInterval / 1000 / 60);
      const newMinutes = Math.floor(newConfig.heartbeatInterval / 1000 / 60);
      changes.push(`Heartbeat Interval: ${oldMinutes}m → ${newMinutes}m`);
      CONFIG.heartbeatInterval = newConfig.heartbeatInterval;

      // Restart heartbeat interval
      if (heartbeatIntervalId) {
        clearInterval(heartbeatIntervalId);
        heartbeatIntervalId = setInterval(async () => {
          const uptime = process.uptime();
          const hours = Math.floor(uptime / 3600);
          const minutes = Math.floor((uptime % 3600) / 60);
          await logToFile(`[HEARTBEAT] Webhook server running (uptime: ${hours}h ${minutes}m)`);
        }, CONFIG.heartbeatInterval);
      }
    }

    // Save to file
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));

    // Log all changes
    if (changes.length > 0) {
      await logToFile('[CONFIG] Configuration updated:');
      for (const change of changes) {
        await logToFile(`[CONFIG]   - ${change}`);
      }

      // Check if restart is needed
      if (changes.some(c => c.includes('requires restart'))) {
        await logToFile('[CONFIG] Server restart required for port change to take effect');
      }
    } else {
      await logToFile('[CONFIG] Configuration saved (no changes)');
    }

    res.json({ status: 'ok', message: 'Configuration saved and applied' });
  } catch (error) {
    await logToFile(`[ERROR] Failed to save configuration: ${error.message}`);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    // Count local files
    let localFiles = 0;
    let totalSize = 0;
    try {
      const files = fsSync.readdirSync(CONFIG.downloadDir);
      localFiles = files.filter(f => {
        const stats = fsSync.statSync(path.join(CONFIG.downloadDir, f));
        if (stats.isFile()) {
          totalSize += stats.size;
          return true;
        }
        return false;
      }).length;
    } catch (e) {
      // Directory might not exist
    }

    const storageMB = (totalSize / 1024 / 1024).toFixed(2);

    // Get ROSS folder item count
    let rossFolderItems = '-';
    try {
      const folderData = await getFolderContents(CONFIG.rossFolderId);
      rossFolderItems = folderData.total || (folderData.hits || []).length;
    } catch (e) {
      // API call failed, keep default
    }

    res.json({
      uptime: `${hours}h ${minutes}m`,
      localFiles,
      storageUsed: `${storageMB} MB`,
      rossFolderItems
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Get webhook sync status
app.get('/api/webhook-status', (req, res) => {
  res.json(webhookSyncStatus);
});

// API: Get logs
app.get('/api/logs', async (req, res) => {
  try {
    const lines = parseInt(req.query.lines) || 50;
    const logContent = await fs.readFile(CONFIG.logFile, 'utf-8');
    const logLines = logContent.trim().split('\n').slice(-lines);
    res.json({ logs: logLines });
  } catch (error) {
    res.json({ logs: ['No logs available'] });
  }
});

// API: Clear logs
app.delete('/api/logs', async (req, res) => {
  try {
    await fs.writeFile(CONFIG.logFile, '');
    await logToFile('[SYSTEM] Logs cleared via GUI');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Trigger sync
app.post('/api/sync', async (req, res) => {
  try {
    syncAllFiles(); // Run async in background
    res.json({ status: 'ok', message: 'Sync started' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Restart server
app.post('/api/restart', async (req, res) => {
  try {
    await logToFile('[SERVER] Restart requested from dashboard');
    res.json({ status: 'ok', message: 'Server restarting...' });

    // Stop cloudflare tunnel
    if (tunnelProcess) {
      tunnelProcess.kill();
    }

    // Spawn new process before exiting
    setTimeout(() => {
      const { spawn } = require('child_process');
      const child = spawn('node', ['mimir-webhook-server.js'], {
        detached: true,
        stdio: 'inherit',
        cwd: __dirname
      });
      child.unref();

      // Exit current process
      process.exit(0);
    }, 1000);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: List files with thumbnails
app.get('/api/files', async (req, res) => {
  try {
    // Get local files
    const files = fsSync.readdirSync(CONFIG.downloadDir);
    const localFiles = files
      .filter(f => {
        const stats = fsSync.statSync(path.join(CONFIG.downloadDir, f));
        return stats.isFile();
      })
      .map(f => {
        const stats = fsSync.statSync(path.join(CONFIG.downloadDir, f));
        return {
          name: f,
          size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          timestamp: stats.mtime
        };
      });

    // Get ROSS folder items from Mimir to match thumbnails
    try {
      const folderData = await getFolderContents(CONFIG.rossFolderId);
      const mimirItems = folderData.hits || [];

      // Match local files with Mimir items by filename
      const filesWithThumbnails = localFiles.map(localFile => {
        const mimirItem = mimirItems.find(item => {
          const originalName = item.originalFileName || '';
          const safeName = originalName.replace(/[^a-z0-9_\-\.]/gi, '_');
          return safeName === localFile.name || originalName === localFile.name;
        });

        return {
          ...localFile,
          thumbnail: mimirItem?.thumbnail || mimirItem?.lowRes || null,
          itemType: mimirItem?.itemType || 'unknown',
          title: mimirItem?.title || localFile.name
        };
      });

      res.json({ files: filesWithThumbnails });
    } catch (apiError) {
      // If Mimir API fails, return files without thumbnails
      res.json({ files: localFiles });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Restart server
app.post('/api/restart', async (req, res) => {
  await logToFile('[SYSTEM] Server restart requested via GUI');
  res.json({ status: 'ok', message: 'Restarting...' });
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  // Load saved config first
  await loadConfigFromFile();

  app.listen(CONFIG.port, () => {
    console.log(`[SERVER] Mimir webhook server running on port ${CONFIG.port}`);
    console.log(`[SERVER] Logs: ${CONFIG.logFile}`);
    console.log(`[SERVER] Downloads: ${CONFIG.downloadDir}`);
    console.log(`\n[SERVER] Webhook endpoint: http://localhost:${CONFIG.port}/webhook/mimir-ross`);
    console.log(`[SERVER] Health check: http://localhost:${CONFIG.port}/health\n`);

    logToFile('[SERVER] Started - Monitoring ROSS folder for new items + Auto-download enabled');

    // Sync all existing files on startup
    syncAllFiles();

    // Start monitoring local folder for changes
    monitorLocalFolder();

    // Auto-start Cloudflare Tunnel
    setTimeout(async () => {
      await startCloudflareTunnel();
    }, 2000);

    // Heartbeat - log every 5 minutes to show server is alive
    heartbeatIntervalId = setInterval(async () => {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      await logToFile(`[HEARTBEAT] Webhook server running (uptime: ${hours}h ${minutes}m)`);
    }, CONFIG.heartbeatInterval);

    // Periodic sync - automatically sync all files to catch moved items
    syncIntervalId = setInterval(async () => {
      const syncMinutes = Math.floor(CONFIG.syncInterval / 1000 / 60);
      await logToFile(`[AUTO-SYNC] Running periodic sync (every ${syncMinutes}m) to catch moved files...`);
      await syncAllFiles();
    }, CONFIG.syncInterval);
  });
}

// Auto-update Mimir webhook with new tunnel URL
async function updateMimirWebhook(webhookUrl) {
  try {
    await logToFile('[WEBHOOK] Updating Mimir webhook configuration...');

    // Get existing webhooks
    const getResponse = await axios.get('https://mimir.mjoll.no/config/api/v1/config/webhooks', {
      headers: {
        'x-mimir-cognito-id-token': `Bearer ${CONFIG.apiKey}`
      }
    });

    const webhooks = getResponse.data || [];
    await logToFile(`[WEBHOOK] Found ${webhooks.length} existing webhooks`);
    if (webhooks.length > 0) {
      await logToFile(`[WEBHOOK] Example webhook structure: ${JSON.stringify(webhooks[0], null, 2)}`);
    }

    const rossWebhook = webhooks.find(wh =>
      wh.label === 'ROSS Folder Monitor' || wh.url?.includes('/webhook/mimir-ross')
    );

    if (rossWebhook) {
      await logToFile(`[WEBHOOK] Found existing webhook, updating URL only`);
      // Just update the URL of the existing webhook
      rossWebhook.url = webhookUrl;

      // Update existing webhook
      await axios.put(
        `https://mimir.mjoll.no/config/api/v1/config/webhooks/${rossWebhook.id}`,
        rossWebhook,
        {
          headers: {
            'x-mimir-cognito-id-token': `Bearer ${CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      await logToFile(`[WEBHOOK] Updated existing webhook URL: ${webhookUrl}`);
    } else {
      await logToFile(`[WEBHOOK] No existing webhook found - manual configuration required`);
    }

    // Update sync status
    webhookSyncStatus = {
      synced: true,
      lastUpdate: new Date().toISOString(),
      error: null
    };

    return true;
  } catch (error) {
    await logToFile(`[WEBHOOK] Failed to update Mimir webhook: ${error.message}`);
    if (error.response) {
      await logToFile(`[WEBHOOK] Error details: ${JSON.stringify(error.response.data)}`);
    }

    // Update sync status with error
    webhookSyncStatus = {
      synced: false,
      lastUpdate: new Date().toISOString(),
      error: error.message
    };

    return false;
  }
}

// Function to start Cloudflare Tunnel
async function startCloudflareTunnel() {
  if (tunnelProcess) {
    return;
  }

  await logToFile('[TUNNEL] Starting Cloudflare Tunnel...');

  tunnelProcess = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${CONFIG.port}`]);
  tunnelUrl = null;

  // Capture output from stderr (cloudflared outputs to stderr)
  tunnelProcess.stderr.on('data', async (data) => {
    const output = data.toString();
    const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (urlMatch && !tunnelUrl) {
      tunnelUrl = urlMatch[0];
      CONFIG.publicUrl = tunnelUrl;
      const webhookUrl = `${tunnelUrl}/webhook/mimir-ross`;
      await logToFile(`[TUNNEL] Tunnel URL: ${tunnelUrl}`);

      // Auto-update Mimir webhook
      await updateMimirWebhook(webhookUrl);
    }
  });

  tunnelProcess.on('error', (error) => {
    logToFile(`[TUNNEL] Error: ${error.message}`);
  });

  tunnelProcess.on('close', (code) => {
    logToFile(`[TUNNEL] Process exited with code ${code}`);
    tunnelProcess = null;
    tunnelUrl = null;
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n[SERVER] Shutting down gracefully...');
  await logToFile('[SERVER] Stopped');
  process.exit(0);
});
