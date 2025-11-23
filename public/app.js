let autoScroll = true;
let logsUpdateInterval;

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    loadStats();
    loadLogs();
    loadWebhookStatus();
    updateTimestamp();

    // Refresh stats every 30 seconds
    setInterval(loadStats, 30000);

    // Refresh logs every 5 seconds
    logsUpdateInterval = setInterval(loadLogs, 5000);

    // Refresh webhook status every 5 seconds
    setInterval(loadWebhookStatus, 5000);

    // Update timestamp every second
    setInterval(updateTimestamp, 1000);

    // Update webhook URL when public URL changes
    document.getElementById('publicUrl').addEventListener('input', updateWebhookUrl);
});

// Folder browser state
let currentBrowserPath = '';

// Load current configuration
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const config = await response.json();

        const folderName = config.rossFolderName || 'Unknown';
        document.getElementById('rossFolderName').textContent = folderName;

        // Update dashboard folder name too
        const dashboardFolderName = document.getElementById('dashboardFolderName');
        if (dashboardFolderName) {
            dashboardFolderName.textContent = folderName;
        }

        document.getElementById('rossFolderId').value = config.rossFolderId || '';
        document.getElementById('apiKey').value = config.apiKey || '';
        document.getElementById('downloadDir').value = config.downloadDirFull || config.downloadDir || '';
        document.getElementById('port').value = config.port || 3000;
        // Convert milliseconds to minutes
        document.getElementById('heartbeatInterval').value = (config.heartbeatInterval || 300000) / 1000 / 60;

        // Update webhook URL
        updateWebhookUrl();
    } catch (error) {
        console.error('Failed to load config:', error);
        // Don't show error on initial page load - server might still be starting
    }
}

// Update webhook URL based on tunnel URL or port
function updateWebhookUrl() {
    // Check if tunnel is running and has a URL
    const tunnelUrlDisplay = document.getElementById('tunnelUrlDisplay');
    const tunnelUrl = tunnelUrlDisplay ? tunnelUrlDisplay.textContent.trim() : null;
    const port = document.getElementById('port').value || '3000';

    // Use tunnel URL if available and valid, otherwise use localhost
    let baseUrl = `http://localhost:${port}`;
    if (tunnelUrl && tunnelUrl !== '-' && tunnelUrl !== 'Starting...' && tunnelUrl.startsWith('https://')) {
        baseUrl = tunnelUrl;
    }

    const webhookUrl = `${baseUrl}/webhook/mimir-ross`;
    document.getElementById('webhookUrl').value = webhookUrl;

    // Update Monitor display
    const monitorWebhookDisplay = document.getElementById('monitorWebhookUrl');
    if (monitorWebhookDisplay) {
        monitorWebhookDisplay.textContent = webhookUrl;
    }
}

// Save configuration
document.getElementById('configForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const config = {
        rossFolderId: document.getElementById('rossFolderId').value,
        apiKey: document.getElementById('apiKey').value,
        downloadDir: document.getElementById('downloadDir').value,
        port: parseInt(document.getElementById('port').value),
        publicUrl: document.getElementById('publicUrl').value,
        // Convert minutes to milliseconds
        heartbeatInterval: parseInt(document.getElementById('heartbeatInterval').value) * 60 * 1000
    };

    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        if (response.ok) {
            showNotification('Configuration saved! Restart server to apply changes.', 'success');
        } else {
            showNotification('Failed to save configuration', 'error');
        }
    } catch (error) {
        console.error('Failed to save config:', error);
        showNotification('Failed to save configuration', 'error');
    }
});

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        document.getElementById('uptime').textContent = stats.uptime;
        document.getElementById('localFiles').textContent = stats.localFiles;
        document.getElementById('rossFolderItems').textContent = stats.rossFolderItems || '-';
        document.getElementById('storageUsed').textContent = stats.storageUsed;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Load webhook sync status
async function loadWebhookStatus() {
    try {
        const response = await fetch('/api/webhook-status');
        const status = await response.json();

        const statusDot = document.getElementById('webhookStatusDot');
        const statusText = document.getElementById('webhookStatusText');

        if (status.synced) {
            statusDot.classList.remove('stopped');
            statusDot.classList.add('running');
            statusText.textContent = 'Synced';
        } else {
            statusDot.classList.remove('running');
            statusDot.classList.add('stopped');
            statusText.textContent = status.error ? 'Error' : 'Not Synced';
        }
    } catch (error) {
        console.error('Failed to load webhook status:', error);
    }
}

// Load logs
async function loadLogs() {
    try {
        const response = await fetch('/api/logs?lines=50');
        const data = await response.json();

        const logsContainer = document.getElementById('logsContainer');
        const wasAtBottom = logsContainer.scrollHeight - logsContainer.scrollTop === logsContainer.clientHeight;

        logsContainer.innerHTML = data.logs.map(log => {
            return `<div class="log-entry">${escapeHtml(log)}</div>`;
        }).join('');

        // Auto-scroll to bottom if enabled and was already at bottom
        if (autoScroll && (wasAtBottom || logsContainer.childElementCount === 0)) {
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
    } catch (error) {
        console.error('Failed to load logs:', error);
    }
}

// Actions
async function openMimirUpload() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        if (config.rossFolderId) {
            // Construct Mimir URL with all required query parameters
            const timestamp = Date.now();
            const params = new URLSearchParams({
                searchString: 'type:video,image,audio,file,clipList,timeline',
                viewType: 'list',
                isFuzzy: 'false',
                atSameTime: 'false',
                defaultDateRangeField: 'mediaCreatedOn',
                ts: timestamp,
                useCustomSearchHook: 'false',
                allTypes: 'false',
                folderId: config.rossFolderId
            });

            const mimirUrl = `https://mimir.mjoll.no/folders?${params.toString()}`;
            window.open(mimirUrl, '_blank');
            showNotification('Opening Mimir folder in new tab...', 'info');
        } else {
            showNotification('ROSS folder ID not configured', 'error');
        }
    } catch (error) {
        showNotification('Failed to open Mimir', 'error');
        console.error(error);
    }
}

async function syncNow() {
    showNotification('Starting sync...', 'info');

    try {
        const response = await fetch('/api/sync', { method: 'POST' });
        if (response.ok) {
            showNotification('Sync started! Check logs for progress.', 'success');
        } else {
            showNotification('Failed to start sync', 'error');
        }
    } catch (error) {
        showNotification('Failed to start sync', 'error');
    }
}

async function restartServer() {
    if (!confirm('Are you sure you want to restart the server? This will disconnect all active connections.')) {
        return;
    }

    showNotification('Restarting server...', 'warning');

    try {
        const response = await fetch('/api/restart', { method: 'POST' });
        if (response.ok) {
            showNotification('Server is restarting... Please wait 5 seconds and reload the page.', 'success');
            // Auto reload page after 5 seconds
            setTimeout(() => {
                window.location.reload();
            }, 5000);
        } else {
            showNotification('Failed to restart server', 'error');
        }
    } catch (error) {
        // Expected error as server will close connection
        showNotification('Server is restarting... Page will reload automatically.', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    }
}

async function viewFiles() {
    try {
        // Show modal
        document.getElementById('fileModal').style.display = 'flex';

        const response = await fetch('/api/files');
        const data = await response.json();
        const gallery = document.getElementById('fileGallery');

        if (data.files.length === 0) {
            gallery.innerHTML = '<div class="no-files">No files downloaded yet</div>';
            return;
        }

        gallery.innerHTML = data.files.map(file => `
            <div class="file-card">
                ${file.thumbnail ?
                    `<img src="${file.thumbnail}" alt="${file.title}" class="file-thumbnail">` :
                    `<div class="file-thumbnail-placeholder">
                        <span class="file-type">${file.itemType || 'FILE'}</span>
                    </div>`
                }
                <div class="file-info">
                    <div class="file-title">${escapeHtml(file.title || file.name)}</div>
                    <div class="file-meta">
                        <span class="file-size">${file.size}</span>
                        <span class="file-type-badge">${file.itemType || 'unknown'}</span>
                    </div>
                </div>
                <button class="file-copy-btn" onclick="copyFilePath('${escapeHtml(file.path || file.name)}', '${escapeHtml(file.title || file.name)}')" title="Copy file path to clipboard">
                    <span class="copy-icon">📋</span>
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load files:', error);
        showNotification('Failed to load files', 'error');
    }
}

function closeFileModal() {
    document.getElementById('fileModal').style.display = 'none';
}

// Copy file path to clipboard
function copyFilePath(path, fileName) {
    navigator.clipboard.writeText(path).then(() => {
        showNotification(`Copied: ${fileName}`, 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy file path', 'error');
    });
}

async function clearLogs() {
    showNotification('Clearing logs...', 'info');

    try {
        const response = await fetch('/api/logs', { method: 'DELETE' });
        if (response.ok) {
            loadLogs();
            showNotification('Logs cleared', 'success');
        } else {
            showNotification('Failed to clear logs', 'error');
        }
    } catch (error) {
        showNotification('Failed to clear logs', 'error');
    }
}

async function restartServer() {
    showNotification('Server restart: Run "node mimir-webhook-server.js" in terminal', 'info');
}

function toggleAutoScroll() {
    autoScroll = !autoScroll;
    document.getElementById('autoScrollText').textContent =
        `Auto-scroll: ${autoScroll ? 'ON' : 'OFF'}`;
}

function refreshLogs() {
    loadLogs();
}

function copyWebhookUrl() {
    const input = document.getElementById('webhookUrl');
    input.select();
    document.execCommand('copy');
    showNotification('Webhook URL copied!', 'success');
}

// Utilities
function updateTimestamp() {
    document.getElementById('lastUpdate').textContent =
        new Date().toLocaleTimeString();
}

function showNotification(message, type = 'info', timeout = 4000) {
    const container = document.getElementById('toastContainer');

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto-remove after specified timeout
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, timeout);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function nudgeHeartbeat(minutes) {
    const input = document.getElementById('heartbeatInterval');
    const currentValue = parseInt(input.value) || 5; // Default to 5 minutes if empty
    const newValue = currentValue + minutes;

    // Enforce min/max constraints (1-60 minutes)
    if (newValue >= 1 && newValue <= 60) {
        input.value = newValue;
    } else if (newValue < 1) {
        input.value = 1;
    } else if (newValue > 60) {
        input.value = 60;
    }
}

// Folder Browser Functions
async function openFolderBrowser() {
    const modal = document.getElementById('folderBrowserModal');
    modal.style.display = 'flex';

    // Start at current download dir or home
    const currentDir = document.getElementById('downloadDir').value;
    await browseTo(currentDir || null);
}

function closeFolderBrowser() {
    document.getElementById('folderBrowserModal').style.display = 'none';
}

async function browseTo(path) {
    try {
        const url = path ? `/api/browse?path=${encodeURIComponent(path)}` : '/api/browse';
        const response = await fetch(url);
        const data = await response.json();

        currentBrowserPath = data.currentPath;
        document.getElementById('currentPathInput').value = currentBrowserPath;

        const folderList = document.getElementById('folderList');

        if (data.items.length === 0) {
            folderList.innerHTML = '<div class="no-folders">No accessible folders in this directory</div>';
            return;
        }

        folderList.innerHTML = data.items.map(item => `
            <div class="folder-item" onclick="browseTo('${item.path.replace(/'/g, "\\'")}')">
                <span class="folder-icon">${item.type === 'parent' ? '⬆️' : '📁'}</span>
                <span class="folder-name">${escapeHtml(item.name)}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to browse folders:', error);
        showNotification('Failed to load folders', 'error');
    }
}

function selectCurrentFolder() {
    document.getElementById('downloadDir').value = currentBrowserPath;
    closeFolderBrowser();
    showNotification('Folder selected. Remember to save configuration!', 'success');
}

// Sync folder name from Mimir
async function syncFolderName() {
    try {
        const response = await fetch('/api/sync-folder-name', { method: 'POST' });
        const data = await response.json();

        if (data.status === 'ok') {
            document.getElementById('rossFolderName').textContent = data.folderName;

            // Update dashboard folder name too
            const dashboardFolderName = document.getElementById('dashboardFolderName');
            if (dashboardFolderName) {
                dashboardFolderName.textContent = data.folderName;
            }

            showNotification(`Folder name synced: ${data.folderName}`, 'success');
        } else {
            showNotification(data.message || 'Failed to sync folder name', 'error');
        }
    } catch (error) {
        console.error('Failed to sync folder name:', error);
        showNotification('Failed to sync folder name. Check API key and folder ID.', 'error');
    }
}

// Cloudflare Tunnel Management
async function loadTunnelStatus() {
    try {
        const response = await fetch('/api/tunnel/status');
        const data = await response.json();

        updateTunnelUI(data.running, data.url);
    } catch (error) {
        console.error('Failed to load tunnel status:', error);
    }
}

function updateTunnelUI(running, url) {
    // Select Configuration tab tunnel status dot specifically
    const configTunnelDot = document.querySelector('#tunnelStatus .status-dot');
    const statusText = document.getElementById('tunnelStatusText');
    const urlDisplay = document.getElementById('tunnelUrlDisplay');
    const startBtn = document.getElementById('startTunnelBtn');
    const stopBtn = document.getElementById('stopTunnelBtn');

    // Also update dashboard tunnel status
    const dashboardDot = document.getElementById('dashboardTunnelDot');
    const dashboardText = document.getElementById('dashboardTunnelText');

    if (running) {
        // Update Configuration tab tunnel status
        if (configTunnelDot) {
            configTunnelDot.classList.remove('stopped');
            configTunnelDot.classList.add('running');
        }
        statusText.textContent = 'Running';
        urlDisplay.textContent = url || 'Starting...';
        startBtn.disabled = true;
        stopBtn.disabled = false;

        // Update button styles - Start disabled, Stop active
        startBtn.classList.remove('btn-success');
        startBtn.classList.add('btn-secondary');
        stopBtn.classList.remove('btn-danger');
        stopBtn.classList.add('btn-primary');

        // Update dashboard
        if (dashboardDot && dashboardText) {
            dashboardDot.classList.remove('stopped');
            dashboardDot.classList.add('running');
            dashboardText.textContent = 'Running';
        }

        // Update webhook URL when tunnel URL is available
        if (url) {
            updateWebhookUrl();
        }
    } else {
        // Update Configuration tab tunnel status
        if (configTunnelDot) {
            configTunnelDot.classList.remove('running');
            configTunnelDot.classList.add('stopped');
        }
        statusText.textContent = 'Stopped';
        urlDisplay.textContent = '-';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        updateWebhookUrl();

        // Update button styles - Start active green, Stop disabled
        startBtn.classList.remove('btn-secondary');
        startBtn.classList.add('btn-success');
        stopBtn.classList.remove('btn-primary');
        stopBtn.classList.add('btn-danger');

        // Update dashboard
        if (dashboardDot && dashboardText) {
            dashboardDot.classList.remove('running');
            dashboardDot.classList.add('stopped');
            dashboardText.textContent = 'Stopped';
        }
    }
}

async function startTunnel() {
    try {
        document.getElementById('startTunnelBtn').disabled = true;
        showNotification('Starting Cloudflare Tunnel...', 'info');

        const response = await fetch('/api/tunnel/start', { method: 'POST' });
        const data = await response.json();

        if (data.status === 'ok') {
            // Poll for status updates
            setTimeout(() => {
                loadTunnelStatus();
                // Keep polling for a few seconds to get the URL
                const pollInterval = setInterval(async () => {
                    await loadTunnelStatus();
                    await loadWebhookStatus(); // Also refresh webhook status
                    const url = document.getElementById('tunnelUrlDisplay').textContent;
                    if (url && url !== '-' && url !== 'Starting...') {
                        clearInterval(pollInterval);
                        showNotification('Tunnel active!', 'success');
                    }
                }, 1000);
                // Stop polling after 10 seconds
                setTimeout(() => clearInterval(pollInterval), 10000);
            }, 2000);
        } else {
            showNotification(data.message || 'Failed to start tunnel', 'error');
            document.getElementById('startTunnelBtn').disabled = false;
        }
    } catch (error) {
        console.error('Failed to start tunnel:', error);
        showNotification('Failed to start tunnel', 'error');
        document.getElementById('startTunnelBtn').disabled = false;
    }
}

async function stopTunnel() {
    try {
        const response = await fetch('/api/tunnel/stop', { method: 'POST' });
        const data = await response.json();

        if (data.status === 'ok') {
            showNotification('Tunnel stopped', 'success');
            updateTunnelUI(false, null);
        } else {
            showNotification(data.message || 'Failed to stop tunnel', 'error');
        }
    } catch (error) {
        console.error('Failed to stop tunnel:', error);
        showNotification('Failed to stop tunnel', 'error');
    }
}

// Track if we've shown the webhook reminder
let webhookReminderShown = false;

// Load tunnel status on page load and periodically
document.addEventListener('DOMContentLoaded', () => {
    loadTunnelStatus();
    // Check tunnel status every 5 seconds
    setInterval(loadTunnelStatus, 5000);
});
