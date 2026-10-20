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

// 2. Normalize DATABASE_URL to absolute path so Prisma and SQLite never fail
const dbFile = path.resolve(storageDir, 'habeba.db');
process.env.DATABASE_URL = `file:${dbFile}`;

// 3. Automatically apply Prisma migrations on boot if needed
try {
  console.log('[Hostinger Boot] Running database migrations...');
  execSync('npx prisma migrate deploy --schema=./server/prisma/schema.prisma', {
    stdio: 'inherit',
    env: process.env,
    timeout: 15000,
  });
  console.log('[Hostinger Boot] Database migrations applied successfully.');
} catch (err) {
  console.error('[Hostinger Boot] Migration note:', err.message);
}

// 4. Start the compiled Express production server
require('./server/dist/server.js');

