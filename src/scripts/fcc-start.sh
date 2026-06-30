#!/usr/bin/env bash
set -euo pipefail

# Start Free Claude Code proxy (fcc-server) in background and write PID file
# Usage: scripts/fcc-start.sh [port]

PORT=${1:-8082}
PIDFILE="/tmp/fcc-server.pid"

if ! command -v fcc-server >/dev/null 2>&1; then
  echo "fcc-server not found in PATH. Make sure you installed free-claude-code via scripts/fcc-install.sh or 'uv tool install'." >&2
  exit 2
fi

echo "Starting fcc-server on port $PORT..."
# Ensure the Settings read the intended port via the PORT env var (the package
# reads settings from env files / env vars rather than CLI args). Export PORT
# into the fcc-server process environment so the configured port is used.
nohup env PORT="$PORT" fcc-server > /tmp/fcc-server.log 2>&1 &
echo $! > "$PIDFILE"
echo "fcc-server started (PID $(cat $PIDFILE)). Logs: /tmp/fcc-server.log"

exit 0
