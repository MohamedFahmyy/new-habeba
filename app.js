const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Ensure storage and upload directories exist
const storageDir = path.resolve(__dirname, 'storage');
const uploadsDir = path.resolve(__dirname, 'storage', 'uploads');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 2. Automatically sync MySQL database schema on boot
try {
  console.log('[Hostinger Boot] Synchronizing MySQL database schema...');
  execSync('npx prisma db push --schema=./server/prisma/schema.prisma --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
    timeout: 30000,
  });
  console.log('[Hostinger Boot] Database schema synchronized successfully.');
} catch (err) {
  console.error('[Hostinger Boot] Schema sync note:', err.message);
}

// 4. Start the compiled Express production server
require('./server/dist/server.js');

