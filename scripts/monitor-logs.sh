#!/bin/bash
# Monitor Mimir ROSS folder activity in real-time
# Usage: ./monitor-logs.sh

LOG_FILE="/Users/yheydlauf/Claude_Code_Yan/Mimir/Ouest-France/Ross-Folder/logs/mimir-ross.log"

echo "🔍 Monitoring ROSS Folder Activity"
echo "=================================="
echo "Watching: $LOG_FILE"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo "⚠️  Log file doesn't exist yet. It will be created when the first item is added to ROSS folder."
    echo "Creating empty log file..."
    touch "$LOG_FILE"
    echo ""
fi

# Display last 20 lines if file has content
if [ -s "$LOG_FILE" ]; then
    echo "📋 Last 20 log entries:"
    echo "---"
    tail -20 "$LOG_FILE"
    echo "---"
    echo ""
    echo "🔄 Watching for new entries..."
    echo ""
fi

# Start monitoring
tail -f "$LOG_FILE"
