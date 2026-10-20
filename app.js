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

// 2. Automatically apply Prisma migrations on boot if needed
try {
  console.log('[Hostinger Boot] Running database migrations...');
  execSync('npx prisma migrate deploy --schema=./server/prisma/schema.prisma', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('[Hostinger Boot] Database migrations applied successfully.');
} catch (err) {
  console.error('[Hostinger Boot] Migration note:', err.message);
}

// 3. Start the compiled Express production server
require('./server/dist/server.js');

