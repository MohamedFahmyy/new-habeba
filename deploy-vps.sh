#!/usr/bin/env bash
# ==============================================================================
# HABEBA PLATFORM – Full VPS Installation & MySQL Setup Script
# Port: 8282 | Auto-creates MySQL Database & Configures Everything
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_DIR="/var/www/habeba"
REPO_URL="https://github.com/MohamedFahmyy/new-habeba.git"
APP_PORT=8282
PM2_APP_NAME="habeba-8282"

echo -e "\n${CYAN}=================================================================${NC}"
echo -e "${GREEN}     🌸 HABEBA PLATFORM – Automated Deployment & MySQL Setup     ${NC}"
echo -e "${CYAN}=================================================================${NC}\n"

# 1. Root Check
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run this script with sudo or as root.${NC}"
  echo -e "Usage: sudo ./deploy-vps.sh"
  exit 1
fi

SERVER_IP=$(curl -s -4 https://ifconfig.me || curl -s -4 https://api.ipify.org || hostname -I | awk '{print $1}')

# 2. Node.js & npm Check
echo -e "${YELLOW}[1/8] Checking Node.js environment...${NC}"
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 18 ]; then
  echo -e "${YELLOW}Installing Node.js 20 LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js $(node -v) & npm $(npm -v) ready.${NC}"

# 3. PM2 Check
echo -e "\n${YELLOW}[2/8] Checking PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}Installing PM2 globally...${NC}"
  npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 $(pm2 -v) ready.${NC}"

# 4. MySQL Server Check & Auto-Installation
echo -e "\n${YELLOW}[3/8] Checking MySQL / MariaDB server...${NC}"
if ! command -v mysql &> /dev/null; then
  echo -e "${YELLOW}MySQL/MariaDB is not installed. Installing mariadb-server...${NC}"
  apt-get update -y
  apt-get install -y mariadb-server
  systemctl enable mariadb
  systemctl start mariadb
fi

# Ensure service is running
systemctl start mariadb 2>/dev/null || systemctl start mysql 2>/dev/null || true
echo -e "${GREEN}✓ Database server is running.${NC}"

# 5. Automatically Provision Database & User
echo -e "\n${YELLOW}[4/8] Provisioning MySQL database & user...${NC}"
DB_NAME="habeba_db"
DB_USER="habeba_user"
ENV_FILE="$APP_DIR/.env"

# Extract existing password if .env exists, otherwise generate secure 20-char random password
if [ -f "$ENV_FILE" ] && grep -q "DATABASE_URL" "$ENV_FILE"; then
  EXISTING_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  # Try to extract password from mysql://user:pass@host:port/db
  DB_PASS=$(echo "$EXISTING_URL" | sed -n 's/.*:\(.*\)@.*/\1/p')
fi

if [ -z "$DB_PASS" ]; then
  DB_PASS=$(openssl rand -hex 12 2>/dev/null || node -e "console.log(require('crypto').randomBytes(12).toString('hex'))")
fi

# Execute MySQL commands with root socket
echo -e "Configuring database '${DB_NAME}' and user '${DB_USER}'..."
mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || \
mysql -u root -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';" 2>/dev/null || \
mysql -u root -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"

mysql -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';" 2>/dev/null || \
mysql -u root -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"

mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';" 2>/dev/null || \
mysql -u root -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';"

mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || \
mysql -u root -e "FLUSH PRIVILEGES;"

DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
echo -e "${GREEN}✓ Database '${DB_NAME}' & user '${DB_USER}' configured successfully.${NC}"

# 6. Setup / Pull Application Files
echo -e "\n${YELLOW}[5/8] Setting up application files in ${APP_DIR}...${NC}"
mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
  echo -e "Pulling latest code from ${REPO_URL}..."
  cd "$APP_DIR"
  git fetch origin main
  git reset --hard origin/main
else
  echo -e "Cloning repository from ${REPO_URL}..."
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

mkdir -p "$APP_DIR/storage/uploads"
chmod -R 775 "$APP_DIR/storage"

# 7. Write Environment (.env)
echo -e "\n${YELLOW}[6/8] Synchronizing environment (.env)...${NC}"
RANDOM_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

cat > "$ENV_FILE" <<EOF
PORT=${APP_PORT}
NODE_ENV=production
CLIENT_URL=http://${SERVER_IP}:${APP_PORT}
DATABASE_URL="${DATABASE_URL}"
SESSION_SECRET="${RANDOM_SECRET}"
ADMIN_PASSWORD="romantic2026"
MAX_FILE_SIZE_BYTES=10485760
EOF
chmod 600 "$ENV_FILE"
echo -e "${GREEN}✓ .env configured with MySQL DATABASE_URL.${NC}"

# 8. Dependencies, Build & Schema Push
echo -e "\n${YELLOW}[7/8] Building project & synchronizing database tables...${NC}"
cd "$APP_DIR"
npm install
npm run build

echo -e "Creating/updating database tables..."
npx prisma db push --schema=./server/prisma/schema.prisma --accept-data-loss

# 9. Firewall & PM2 Process
echo -e "\n${YELLOW}[8/8] Starting application on port ${APP_PORT}...${NC}"
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
  ufw allow ${APP_PORT}/tcp > /dev/null
  echo -e "${GREEN}✓ Firewall port ${APP_PORT}/tcp opened.${NC}"
fi

if pm2 describe "$PM2_APP_NAME" &> /dev/null; then
  pm2 reload "$PM2_APP_NAME" --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save > /dev/null

echo -e "\n${CYAN}=================================================================${NC}"
echo -e "${GREEN}🎉 HABEBA PLATFORM IS LIVE & READY!${NC}"
echo -e "${CYAN}=================================================================${NC}"
echo -e "🌐 URL:              ${CYAN}http://${SERVER_IP}:${APP_PORT}${NC}"
echo -e "🗄️ Database:         ${DB_NAME} (User: ${DB_USER})"
echo -e "📁 Directory:        ${APP_DIR}"
echo -e "⚙️ Process:          pm2 logs ${PM2_APP_NAME}"
echo -e "🔄 Fast Update:      sudo bash ${APP_DIR}/update-vps.sh"
echo -e "${CYAN}=================================================================${NC}\n"
