import { Router } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errors.js';
import { config } from '../../config/index.js';
import { prisma } from '../../services/db.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSizeBytes, files: 1 },
});

// ── Upload route ──────────────────────────────────────────────────────────────
router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'No file provided', 'NO_FILE');

    // Validate MIME via file signature (magic bytes) with safe fallbacks
    const header = req.file.buffer.slice(0, 4).toString('hex').toLowerCase();
    let detectedMime: string | null = null;

    if (header.startsWith('ffd8')) {
      detectedMime = 'image/jpeg';
    } else if (header.startsWith('89504e47')) {
      detectedMime = 'image/png';
    } else if (header.startsWith('52494646')) {
      detectedMime = 'image/webp';
    } else if (header.startsWith('47494638')) {
      detectedMime = 'image/gif';
    } else if (req.file.mimetype && config.upload.allowedMimeTypes.includes(req.file.mimetype)) {
      detectedMime = req.file.mimetype;
    } else {
      const extMatch = path.extname(req.file.originalname || '').toLowerCase();
      if (['.jpg', '.jpeg'].includes(extMatch)) detectedMime = 'image/jpeg';
      else if (extMatch === '.png') detectedMime = 'image/png';
      else if (extMatch === '.webp') detectedMime = 'image/webp';
      else if (extMatch === '.gif') detectedMime = 'image/gif';
    }

    if (!detectedMime) {
      throw new AppError(415, 'File type not allowed. Only JPEG, PNG, WebP, and GIF are accepted.', 'INVALID_FILE_TYPE');
    }

    // Generate safe server-side filename
    const ext = detectedMime.split('/')[1].replace('jpeg', 'jpg');
    const filename = `${uuidv4()}.${ext}`;
    const userId = req.session.userId;
    const userDir = path.join(config.upload.dir, String(userId));
    await fs.mkdir(userDir, { recursive: true });

    const filePath = path.join(userDir, filename);
    await fs.writeFile(filePath, req.file.buffer);

    // Public URL (relative, frontend resolves against API base)
    const url = `/api/uploads/${userId}/${filename}`;

    res.status(201).json({ success: true, url, filename });
  } catch (err) { next(err); }
});

// ── Serve payment receipts ──────────────────────────────────────────────────
router.get('/receipts/:filename', async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);

    // Multi-candidate search across all possible working directories & upload paths
    const candidateDirs = [
      path.join(config.upload.dir, 'receipts'),
      path.resolve(process.cwd(), 'storage/uploads/receipts'),
      path.resolve(process.cwd(), 'server/storage/uploads/receipts'),
      path.resolve(__dirname, '../../../storage/uploads/receipts'),
      path.resolve(__dirname, '../../storage/uploads/receipts'),
      '/var/www/habeba/storage/uploads/receipts',
      '/var/www/habeba/server/storage/uploads/receipts',
      path.join(config.upload.dir),
      path.resolve(process.cwd(), 'storage/uploads'),
      '/var/www/habeba/storage/uploads',
    ];

    let foundFile: string | null = null;
    for (const dir of candidateDirs) {
      const candidatePath = path.join(dir, filename);
      try {
        await fs.access(candidatePath);
        foundFile = candidatePath;
        break;
      } catch {
        // Try next candidate
      }
    }

    if (!foundFile) {
      return res.status(404).json({
        success: false,
        code: 'RECEIPT_NOT_FOUND',
        message: 'Receipt image file not found on server disk.',
      });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
    };
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }

    return res.sendFile(path.resolve(foundFile), (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({
          success: false,
          code: 'FILE_SEND_ERROR',
          message: 'Unable to stream receipt file.',
        });
      }
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        code: 'RECEIPT_SERVER_ERROR',
        message: 'Error retrieving receipt image.',
      });
    }
  }
});

// ── Serve uploads (publicly viewable on gift pages with path traversal protection) ──
router.get('/:userId/:filename', async (req, res) => {
  try {
    const userId = req.params.userId;
    const filename = path.basename(req.params.filename);

    const candidateDirs = [
      path.join(config.upload.dir, userId),
      path.resolve(process.cwd(), 'storage/uploads', userId),
      path.resolve(process.cwd(), 'server/storage/uploads', userId),
      path.resolve(__dirname, '../../../storage/uploads', userId),
      path.resolve(__dirname, '../../storage/uploads', userId),
      path.join('/var/www/habeba/storage/uploads', userId),
      path.join('/var/www/habeba/server/storage/uploads', userId),
    ];

    let foundFile: string | null = null;
    for (const dir of candidateDirs) {
      const candidatePath = path.join(dir, filename);
      try {
        await fs.access(candidatePath);
        foundFile = candidatePath;
        break;
      } catch {
        // Try next candidate
      }
    }

    if (!foundFile) {
      return res.status(404).json({
        success: false,
        code: 'FILE_NOT_FOUND',
        message: 'Upload file not found on server disk.',
      });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }

    return res.sendFile(path.resolve(foundFile), (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({
          success: false,
          code: 'FILE_SEND_ERROR',
          message: 'Unable to stream file.',
        });
      }
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        code: 'FILE_SERVER_ERROR',
        message: 'Error retrieving file.',
      });
    }
  }
});

export default router;
