#!/usr/bin/env bash
# ==============================================================================
# HABEBA PLATFORM – Automated VPS Deployment Script
# Port: 8282 | Protocol: HTTP | Process Manager: PM2
# Safe to run alongside other websites (isolated directory, separate port & PM2)
# ==============================================================================

set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

APP_DIR="/var/www/habeba"
REPO_URL="https://github.com/MohamedFahmyy/new-habeba.git"
APP_PORT=8282
PM2_APP_NAME="habeba-8282"

echo -e "\n${CYAN}=================================================================${NC}"
echo -e "${GREEN}     🌸 HABEBA PLATFORM – VPS Deployment on Port ${APP_PORT}     ${NC}"
echo -e "${CYAN}=================================================================${NC}\n"

# 1. Check Root / Sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run this script with sudo or as root.${NC}"
  echo -e "Usage: sudo ./deploy-vps.sh"
  exit 1
fi

# Detect Server IP
SERVER_IP=$(curl -s -4 https://ifconfig.me || curl -s -4 https://api.ipify.org || hostname -I | awk '{print $1}')

# 2. Check & Install Node.js (v20 LTS recommended)
echo -e "${YELLOW}[1/7] Checking Node.js and npm...${NC}"
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 18 ]; then
  echo -e "${YELLOW}Node.js >= 18 is not installed. Installing Node.js 20 LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js version: $(node -v) | npm version: $(npm -v)${NC}"

# 3. Check & Install PM2
echo -e "\n${YELLOW}[2/7] Checking PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}Installing PM2 globally...${NC}"
  npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 is installed ($(pm2 -v))${NC}"

# 4. Clone or Update Repository in $APP_DIR
echo -e "\n${YELLOW}[3/7] Setting up application files in ${APP_DIR}...${NC}"
mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
  echo -e "Existing repository found in ${APP_DIR}. Pulling latest changes..."
  cd "$APP_DIR"
  git fetch origin main
  git reset --hard origin/main
else
  echo -e "Cloning repository from ${REPO_URL} into ${APP_DIR}..."
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# Ensure storage directories exist
mkdir -p "$APP_DIR/storage/uploads"
chmod -R 775 "$APP_DIR/storage"

# 5. Environment Configuration (.env)
echo -e "\n${YELLOW}[4/7] Configuring environment variables (.env)...${NC}"
ENV_FILE="$APP_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${CYAN}Creating new .env file...${NC}"
  
  # Generate a secure random session secret
  RANDOM_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  
  # Prompt for DATABASE_URL if in interactive terminal, else use default MySQL
  DEFAULT_DB="mysql://root:password@localhost:3306/habeba"
  if [ -t 0 ]; then
    echo -e "${YELLOW}Please enter your MySQL DATABASE_URL:${NC}"
    echo -e "Format: mysql://USERNAME:PASSWORD@localhost:3306/DATABASE_NAME"
    read -r -p "DATABASE_URL [default: ${DEFAULT_DB}]: " USER_DB
    DATABASE_URL="${USER_DB:-$DEFAULT_DB}"
  else
    DATABASE_URL="${DEFAULT_DB}"
  fi

  cat > "$ENV_FILE" <<EOF
PORT=${APP_PORT}
NODE_ENV=production
CLIENT_URL=http://${SERVER_IP}:${APP_PORT}
DATABASE_URL="${DATABASE_URL}"
SESSION_SECRET="${RANDOM_SECRET}"
ADMIN_PASSWORD="romantic_admin_2026"
MAX_FILE_SIZE_BYTES=10485760
EOF

  echo -e "${GREEN}✓ Created .env file.${NC}"
else
  # Ensure PORT is 8282 in existing .env
  sed -i "s/^PORT=.*/PORT=${APP_PORT}/" "$ENV_FILE" || echo "PORT=${APP_PORT}" >> "$ENV_FILE"
  echo -e "${GREEN}✓ Existing .env preserved (PORT verified as ${APP_PORT}).${NC}"
fi

# 6. Install Dependencies & Build
echo -e "\n${YELLOW}[5/7] Installing dependencies & building project...${NC}"
cd "$APP_DIR"

# Install root, client, and server dependencies
npm install

# Run full project build (Server tsc + Prisma client + Vite React build)
npm run build

# Synchronize database schema
echo -e "\n${YELLOW}[6/7] Synchronizing database schema...${NC}"
npx prisma db push --schema=./server/prisma/schema.prisma --accept-data-loss || {
  echo -e "${YELLOW}[WARNING] prisma db push encountered an issue. Check your DATABASE_URL in ${APP_DIR}/.env${NC}"
}

# 7. Configure Firewall (allow port 8282 without affecting other ports)
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
  echo -e "Opening port ${APP_PORT} in UFW firewall..."
  ufw allow ${APP_PORT}/tcp > /dev/null
  echo -e "${GREEN}✓ UFW firewall port ${APP_PORT}/tcp opened.${NC}"
fi

# 8. Start / Reload with PM2
echo -e "\n${YELLOW}[7/7] Launching application with PM2...${NC}"
cd "$APP_DIR"

# Check if app is already running under PM2
if pm2 describe "$PM2_APP_NAME" &> /dev/null; then
  echo -e "Reloading running PM2 process (${PM2_APP_NAME})..."
  pm2 reload "$PM2_APP_NAME" --update-env
else
  echo -e "Starting new PM2 process (${PM2_APP_NAME})..."
  pm2 start ecosystem.config.js
fi

# Save PM2 state for automatic reboot persistence
pm2 save > /dev/null

echo -e "\n${CYAN}=================================================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${CYAN}=================================================================${NC}"
echo -e "🌸 Application:     Habeba Romantic Gifts Platform"
echo -e "🌐 Access URL:       ${CYAN}http://${SERVER_IP}:${APP_PORT}${NC}"
echo -e "📁 Directory:        ${APP_DIR}"
echo -e "⚙️ Process Name:     ${PM2_APP_NAME}"
echo -e "📄 Environment File: ${APP_DIR}/.env"
echo -e "📋 PM2 Logs:         pm2 logs ${PM2_APP_NAME}"
echo -e "🔄 Restart Command:  pm2 restart ${PM2_APP_NAME}"
echo -e "${CYAN}=================================================================${NC}\n"
