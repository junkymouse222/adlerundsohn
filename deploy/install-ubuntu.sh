#!/usr/bin/env bash
# =============================================================================
# Adler und Sohn - Self-Hosting Installer für Ubuntu 22.04 / 24.04
# =============================================================================
# Was das Script macht:
#   1. System-Update + Basis-Tools (git, curl, ufw)
#   2. Node.js 22 LTS via NodeSource
#   3. Bun (für Installs/Build, gleiche Toolchain wie Lovable)
#   4. Caddy als Reverse Proxy mit automatischem Let's-Encrypt-SSL
#   5. App-User `adler`, Repo-Clone nach /opt/adlerundsohn
#   6. .env-Datei mit deinen Secrets (interaktiv abgefragt)
#   7. Build als Node-Server (Nitro Preset node-server)
#   8. systemd-Service, der die App auf Port 3000 startet
#   9. Caddy-Config für adlerundsohn.com + www
#
# Voraussetzungen VOR dem Start:
#   - DNS: A-Record adlerundsohn.com     -> 45.149.145.6
#   -      A-Record www.adlerundsohn.com -> 45.149.145.6
#     (mit `dig +short adlerundsohn.com` prüfen)
#   - Git-Repo-URL bereit (GitHub, Lovable "Connect to GitHub")
#   - Supabase URL + Publishable + Service-Role Key + Resend API Key bereit
#
# Ausführen als root:
#   bash install-ubuntu.sh
# =============================================================================

set -euo pipefail

DOMAIN="adlerundsohn.com"
APP_USER="adler"
APP_DIR="/opt/adlerundsohn"
APP_PORT="3000"

log()  { echo -e "\033[1;34m[$(date +%H:%M:%S)]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
fail() { echo -e "\033[1;31m[FAIL]\033[0m $*"; exit 1; }

[[ $EUID -eq 0 ]] || fail "Bitte als root ausführen (sudo -i)."

# --- Eingaben ----------------------------------------------------------------
read -rp "Git-Repo-URL (z.B. https://github.com/user/repo.git): " REPO_URL
[[ -n "$REPO_URL" ]] || fail "Repo-URL erforderlich."
read -rp "Git-Branch [main]: " REPO_BRANCH
REPO_BRANCH="${REPO_BRANCH:-main}"

echo
log "Supabase / Resend Secrets eingeben (werden in $APP_DIR/.env geschrieben):"
read -rp "SUPABASE_URL (https://xxx.supabase.co): " SUPA_URL
read -rp "SUPABASE_PUBLISHABLE_KEY (sb_publishable_...): " SUPA_PUB
read -rsp "SUPABASE_SERVICE_ROLE_KEY (sb_secret_...): " SUPA_SVC; echo
read -rsp "RESEND_API_KEY (re_...): " RESEND_KEY; echo
read -rp "LOVABLE_API_KEY (optional, sonst leer): " LOVABLE_KEY

# --- System ------------------------------------------------------------------
log "System aktualisieren…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git ca-certificates gnupg ufw debian-keyring debian-archive-keyring apt-transport-https unzip build-essential

# --- Firewall ----------------------------------------------------------------
log "UFW-Firewall (SSH, HTTP, HTTPS)…"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# --- Node 22 -----------------------------------------------------------------
if ! command -v node >/dev/null || [[ "$(node -v)" != v22.* ]]; then
  log "Node.js 22 LTS installieren…"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
log "Node: $(node -v), npm: $(npm -v)"

# --- Bun ---------------------------------------------------------------------
if ! command -v bun >/dev/null; then
  log "Bun installieren…"
  curl -fsSL https://bun.sh/install | bash
  ln -sf /root/.bun/bin/bun /usr/local/bin/bun
fi
log "Bun: $(bun -v)"

# --- Caddy -------------------------------------------------------------------
if ! command -v caddy >/dev/null; then
  log "Caddy installieren…"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -y
  apt-get install -y caddy
fi

# --- App-User + Verzeichnis --------------------------------------------------
if ! id "$APP_USER" &>/dev/null; then
  log "User $APP_USER anlegen…"
  useradd -m -s /bin/bash "$APP_USER"
fi
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# --- Repo klonen / updaten ---------------------------------------------------
if [[ -d "$APP_DIR/.git" ]]; then
  log "Repo existiert - pull…"
  sudo -u "$APP_USER" git -C "$APP_DIR" fetch --all
  sudo -u "$APP_USER" git -C "$APP_DIR" checkout "$REPO_BRANCH"
  sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard "origin/$REPO_BRANCH"
else
  log "Repo klonen…"
  sudo -u "$APP_USER" git clone -b "$REPO_BRANCH" "$REPO_URL" "$APP_DIR"
fi

# --- .env schreiben ----------------------------------------------------------
log ".env schreiben…"
cat > "$APP_DIR/.env" <<EOF
# Runtime env für den Node-Server
NODE_ENV=production
PORT=$APP_PORT
HOST=127.0.0.1

# Supabase (server)
SUPABASE_URL=$SUPA_URL
SUPABASE_PUBLISHABLE_KEY=$SUPA_PUB
SUPABASE_SERVICE_ROLE_KEY=$SUPA_SVC

# Supabase (client / Vite - werden beim Build eingebacken)
VITE_SUPABASE_URL=$SUPA_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPA_PUB

# Mail
RESEND_API_KEY=$RESEND_KEY

# Öffentliche Site-URL (für PDF-Links, Accept/Pay URLs)
PUBLIC_SITE_URL=https://$DOMAIN
SITE_URL=https://$DOMAIN

# Optional
LOVABLE_API_KEY=$LOVABLE_KEY
EOF
chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

# --- Install + Build ---------------------------------------------------------
log "Dependencies installieren (bun install)…"
sudo -u "$APP_USER" bash -c "cd $APP_DIR && bun install"

log "Build (Nitro Preset node-server)…"
sudo -u "$APP_USER" bash -c "cd $APP_DIR && NITRO_PRESET=node-server bun run build"

# Nitro node-server Output liegt in .output/server/index.mjs
if [[ ! -f "$APP_DIR/.output/server/index.mjs" ]]; then
  fail "Build-Output nicht gefunden ($APP_DIR/.output/server/index.mjs). Log oben prüfen."
fi

# --- systemd-Service ---------------------------------------------------------
log "systemd-Service anlegen…"
cat > /etc/systemd/system/adlerundsohn.service <<EOF
[Unit]
Description=Adler und Sohn (TanStack Start / Nitro node-server)
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/node $APP_DIR/.output/server/index.mjs
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable adlerundsohn
systemctl restart adlerundsohn
sleep 3
systemctl --no-pager status adlerundsohn | head -20 || true

# --- Caddy-Config ------------------------------------------------------------
log "Caddy-Config schreiben…"
cat > /etc/caddy/Caddyfile <<EOF
{
  email admin@$DOMAIN
}

$DOMAIN, www.$DOMAIN {
  encode zstd gzip
  reverse_proxy 127.0.0.1:$APP_PORT
}
EOF

systemctl enable caddy
systemctl restart caddy

log "Fertig!"
echo
echo "  App:     https://$DOMAIN  (SSL wird automatisch von Caddy geholt, 30-90 sek)"
echo "  Logs:    journalctl -u adlerundsohn -f"
echo "  Caddy:   journalctl -u caddy -f"
echo "  Update:  cd $APP_DIR && sudo -u $APP_USER git pull && sudo -u $APP_USER bun install \\"
echo "           && sudo -u $APP_USER NITRO_PRESET=node-server bun run build \\"
echo "           && systemctl restart adlerundsohn"
echo
warn "Ändere jetzt dein Root-Passwort mit 'passwd' und richte SSH-Keys ein!"
