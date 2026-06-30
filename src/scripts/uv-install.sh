#!/usr/bin/env bash
# Helper script: two functions to install `uv` and install Python 3.14 via uv.
# Usage:
#   source scripts/uv-install.sh
#   install_uv_unix            # run installer, self-update, install python 3.14
#   install_uv_powershell_flow # run installer, self-update, invoke Powershell installer (if pwsh available) and install python

set -euo pipefail

install_uv_unix() {
  echo "==> Installing uv (Unix script)"
  curl -LsSf https://astral.sh/uv/install.sh | sh
  echo "==> uv installed. Running 'uv self update'"
  uv self update || { echo "uv self update failed"; return 1; }
  echo "==> Installing Python 3.14 via uv"
  uv python install 3.14 || { echo "uv python install 3.14 failed"; return 1; }
  echo "==> Done"
}

install_uv_powershell_flow() {
  echo "==> Installing uv (Unix script)"
  curl -LsSf https://astral.sh/uv/install.sh | sh
  echo "==> uv installed. Running 'uv self update'"
  uv self update || { echo "uv self update failed"; return 1; }

  # Try to run PowerShell-based installer via pwsh if available
  if command -v pwsh >/dev/null 2>&1; then
    echo "==> Found pwsh; running PowerShell installer for uv python"
    pwsh -NoProfile -ExecutionPolicy Bypass -Command "Invoke-RestMethod 'https://astral.sh/uv/install.ps1' | Invoke-Expression"
    echo "==> Running uv python install 3.14 (powershell flow)"
    uv python install 3.14 || { echo "uv python install 3.14 failed"; return 1; }
  else
    echo "pwsh not found. To run the PowerShell flow you need PowerShell Core (pwsh) installed." >&2
    echo "You can instead run the unix flow: install_uv_unix" >&2
    return 2
  fi

  echo "==> Done"
}

# If script executed directly, print usage
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  cat <<'USAGE'
This script defines two functions. Source it to use them:

  source scripts/uv-install.sh
  install_uv_unix
  install_uv_powershell_flow

Running the script directly will show this message.
USAGE
fi
