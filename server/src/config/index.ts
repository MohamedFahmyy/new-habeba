import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] || fallback;

export const config = {
  env: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '3001'), 10),
  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),

  session: {
    secret: optional('SESSION_SECRET', 'habeba_dev_secret_change_in_production_2024'),
    name: 'habeba.sid',
    maxAgeMs: parseInt(optional('SESSION_MAX_AGE_MS', String(7 * 24 * 60 * 60 * 1000)), 10),
  },

  database: {
    url: optional('DATABASE_URL', 'file:../storage/habeba.db'),
    provider: optional('DB_PROVIDER', 'sqlite'),
  },

  upload: {
    dir: path.resolve(__dirname, '../../storage/uploads'),
    maxFileSizeBytes: parseInt(optional('MAX_FILE_SIZE_BYTES', String(10 * 1024 * 1024)), 10),
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedSignatures: {
      'ffd8ff': 'image/jpeg',  // JPEG
      '89504e47': 'image/png', // PNG
      '52494646': 'image/webp', // WebP (RIFF)
      '47494638': 'image/gif', // GIF
    } as Record<string, string>,
  },

  rateLimits: {
    loginWindowMs: 15 * 60 * 1000,
    loginMaxAttempts: 10,
    apiWindowMs: 60 * 1000,
    apiMaxRequests: 120,
  },

  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};
