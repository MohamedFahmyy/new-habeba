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

    // Validate MIME via file signature (magic bytes) — not just extension
    const header = req.file.buffer.slice(0, 4).toString('hex');
    let detectedMime: string | null = null;
    for (const [sig, mime] of Object.entries(config.upload.allowedSignatures)) {
      if (header.startsWith(sig)) { detectedMime = mime; break; }
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

// ── Serve uploads (publicly viewable on gift pages with path traversal protection) ──
router.get('/:userId/:filename', async (req, res, next) => {
  try {
    const requestedUserId = parseInt(req.params.userId, 10);
    if (isNaN(requestedUserId)) {
      throw new AppError(400, 'Invalid user ID', 'INVALID_ID');
    }

    // Prevent path traversal
    const filename = path.basename(req.params.filename);
    const filePath = path.join(config.upload.dir, String(requestedUserId), filename);

    // Verify file is within the uploads directory
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(config.upload.dir))) {
      throw new AppError(400, 'Invalid path', 'INVALID_PATH');
    }

    res.sendFile(resolved);
  } catch (err) { next(err); }
});

export default router;
