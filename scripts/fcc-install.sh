#!/usr/bin/env bash
set -euo pipefail

# Install Free Claude Code proxy using uv tool.
# Prerequisites: uv installed and Python 3.14 available via uv.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v uv >/dev/null 2>&1; then
  echo "uv not found. Run scripts/uv-install.sh or install uv manually." >&2
  exit 2
fi

echo "Installing Free Claude Code via uv tool (force update)..."
uv tool install --force git+https://github.com/Alishahryar1/free-claude-code.git

echo "Installation complete. 'fcc-server' and 'fcc-claude' should be available in your PATH via uv." 

echo "To start the server now run: scripts/fcc-start.sh" 

exit 0
