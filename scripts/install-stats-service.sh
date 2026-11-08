#!/usr/bin/env bash
# Install, or reinstall, the private stats dashboard service on a fresh openSUSE system.
# Safe to run again: each step skips what is already done.
#
#   scripts/install-stats-service.sh
#
# Run it as your own user, never with sudo: the service runs as you, and needs your gh login.
# It asks for your password (a KDE popup) only if Node.js has to be installed.
set -euo pipefail
cd "$(dirname "$(readlink -f "$0")")/.."

say() { echo "install-stats: $1"; }
unit=ants-stats
url=http://127.0.0.1:4321/

if [[ $EUID -eq 0 ]]; then
  say "run this as your own user, not root"; exit 1
fi

# 1. Node.js, at the major version the site build uses. The unit runs /usr/bin/node.
major=$(./local-CI.sh --print-node-major)
if [[ -x /usr/bin/node ]]; then
  say "Node.js present: $(/usr/bin/node --version)"
else
  say "installing Node.js $major"
  SUDO_ASKPASS=/usr/libexec/ssh/ksshaskpass sudo -A \
    -p "Claude Code: install Node.js $major via zypper for the stats dashboard" \
    zypper --non-interactive install "nodejs$major" "npm$major"
fi

# PySide6 runs the optional tray icon, and its tests run in the pre-push gate.
if python3 -c 'import PySide6' 2>/dev/null; then
  say "PySide6 present"
else
  pkg="python$(python3 -c 'import sys; print(f"{sys.version_info[0]}{sys.version_info[1]}")')-pyside6"
  say "installing $pkg"
  SUDO_ASKPASS=/usr/libexec/ssh/ksshaskpass sudo -A \
    -p "Claude Code: install PySide6 via zypper for the stats tray" \
    zypper --non-interactive install "$pkg"
fi

# 2. The project's own packages.
if [[ -d node_modules ]]; then
  say "packages present"
else
  say "installing packages (npm ci)"
  npm ci
fi

# 3. Link the unit into your user systemd folder; start it now and at every login.
mkdir -p ~/.config/systemd/user
ln -sf "$PWD/systemd/$unit.service" ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable "$unit"
systemctl --user restart "$unit"

# 4. Prove it answers.
up=no
for _ in $(seq 1 10); do
  if curl -fs -o /dev/null "$url"; then up=yes; break; fi
  sleep 1
done
if [[ $up == no ]]; then
  say "the dashboard did not answer at $url; recent log:"
  journalctl --user -u "$unit" -n 20 --no-pager
  exit 1
fi
say "dashboard is running at $url"

# 5. Refreshing reads GitHub through your gh login. Warn, don't fail: the page still serves.
if ! gh auth status >/dev/null 2>&1; then
  say "warning: gh is not logged in, so refreshes will fail. Run: gh auth login"
fi
