#!/usr/bin/env bash
# ==============================================================================
# HABEBA PLATFORM – Quick VPS Update & Database Sync Script
# Run this anytime you push updates to GitHub to update your live VPS!
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_DIR="/var/www/habeba"
PM2_APP_NAME="habeba-8282"
APP_PORT=8282

echo -e "\n${CYAN}=================================================================${NC}"
echo -e "${GREEN}     🌸 HABEBA PLATFORM – Updating VPS & Syncing Database     ${NC}"
echo -e "${CYAN}=================================================================${NC}\n"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run this script with sudo or as root.${NC}"
  echo -e "Usage: sudo ./update-vps.sh"
  exit 1
fi

cd "$APP_DIR" || { echo -e "${RED}[ERROR] Cannot find directory ${APP_DIR}${NC}"; exit 1; }

# 1. Pull latest code
echo -e "${YELLOW}[1/4] Pulling latest updates from GitHub...${NC}"
git fetch origin main
git reset --hard origin/main
echo -e "${GREEN}✓ Code updated to latest commit ($(git log -1 --oneline)).${NC}"

# 2. Install dependencies & build
echo -e "\n${YELLOW}[2/4] Installing dependencies & building project...${NC}"
npm install
npm run build
echo -e "${GREEN}✓ Build succeeded.${NC}"

# 3. Synchronize Database
echo -e "\n${YELLOW}[3/5] Synchronizing MySQL database tables...${NC}"
npx prisma db push --schema=./server/prisma/schema.prisma --accept-data-loss
echo -e "${GREEN}✓ Database schema synchronized.${NC}"

# 4. Storage permissions & Upload Limits
echo -e "\n${YELLOW}[4/5] Ensuring storage directory write permissions (777)...${NC}"
mkdir -p "${APP_DIR}/storage/uploads/receipts"
mkdir -p "${APP_DIR}/server/storage/uploads/receipts" 2>/dev/null || true
if [ -d "${APP_DIR}/server/storage/uploads/receipts" ]; then
  cp -rn "${APP_DIR}/server/storage/uploads/receipts/"* "${APP_DIR}/storage/uploads/receipts/" 2>/dev/null || true
fi
chmod -R 777 "${APP_DIR}/storage" 2>/dev/null || true
chmod -R 777 "${APP_DIR}/server/storage" 2>/dev/null || true
if command -v nginx &>/dev/null && [ -d "/etc/nginx/conf.d" ]; then
  echo "client_max_body_size 50M;" > /etc/nginx/conf.d/habeba_uploads.conf 2>/dev/null || true
  nginx -t &>/dev/null && (systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true)
fi
echo -e "${GREEN}✓ Storage upload permissions verified.${NC}"

# 5. Reload PM2 (Zero Downtime)
echo -e "\n${YELLOW}[5/5] Reloading application process...${NC}"
pm2 reload "$PM2_APP_NAME" --update-env || pm2 start ecosystem.config.js
pm2 save > /dev/null

SERVER_IP=$(curl -s -4 https://ifconfig.me || curl -s -4 https://api.ipify.org || hostname -I | awk '{print $1}')

echo -e "\n${CYAN}=================================================================${NC}"
echo -e "${GREEN}✅ UPDATE COMPLETED SUCCESSFULLY!${NC}"
echo -e "${CYAN}=================================================================${NC}"
echo -e "🌐 Site URL:   ${CYAN}http://${SERVER_IP}:${APP_PORT}${NC}"
echo -e "📋 Live Logs:  pm2 logs ${PM2_APP_NAME}"
echo -e "${CYAN}=================================================================${NC}\n"
