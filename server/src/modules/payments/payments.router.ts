import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/errors.js';
import { prisma } from '../../services/db.js';
import { getSettingValue } from '../settings/settings.service.js';
import { config } from '../../config/index.js';

const router = Router();

const receiptStorage = multer.memoryStorage();
const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// ── Submit manual payment (InstaPay / Vodafone Cash) ─────────────────────────
const PaymentSchema = z.object({
  giftId: z.number().int().positive(),
  provider: z.enum(['instapay', 'vodafone_cash']),
  transactionReference: z.string().min(1).max(255),
});

router.post('/submit', requireAuth, receiptUpload.single('receipt'), async (req, res, next) => {
  try {
    const data = PaymentSchema.parse({
      giftId: parseInt(req.body.giftId, 10),
      provider: req.body.provider,
      transactionReference: req.body.transactionReference,
    });

    // Verify gift ownership
    const gift = await prisma.gift.findFirst({ where: { id: data.giftId, userId: req.session.userId } });
    if (!gift) throw new NotFoundError('Gift');
    if (gift.paymentStatus === 'paid') throw new AppError(409, 'Gift is already paid', 'ALREADY_PAID');

    // Get price from settings
    const price = parseFloat((await getSettingValue('payment_price')) ?? '149');
    const currency = (await getSettingValue('payment_currency')) ?? 'EGP';

    // Handle optional receipt file
    let receiptPath: string | undefined;
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const safe = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
      if (!safe.includes(ext)) throw new AppError(415, 'Invalid receipt file type', 'INVALID_FILE_TYPE');
      const filename = `receipt_${uuidv4()}${ext}`;
      const receiptDir = path.join(config.upload.dir, 'receipts');
      await fs.mkdir(receiptDir, { recursive: true });
      await fs.writeFile(path.join(receiptDir, filename), req.file.buffer);
      receiptPath = `receipts/${filename}`;
    }

    const userId = req.session.userId!;

    const order = await prisma.order.create({
      data: { userId, giftId: data.giftId, amount: price, currency, status: 'pending' },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        giftId: data.giftId,
        userId,
        provider: data.provider,
        transactionReference: data.transactionReference,
        amount: price,
        currency,
        status: 'awaiting_review',
        receiptPath,
      },
    });

    // Update gift payment status to pending
    await prisma.gift.update({ where: { id: data.giftId }, data: { paymentStatus: 'pending' } });

    res.status(201).json({ success: true, payment: { id: payment.id, status: payment.status } });
  } catch (err) { next(err); }
});

// ── Get payment status for a gift ─────────────────────────────────────────────
router.get('/gift/:giftId', requireAuth, async (req, res, next) => {
  try {
    const giftId = parseInt(String(req.params.giftId), 10);
    const gift = await prisma.gift.findFirst({ where: { id: giftId, userId: req.session.userId } });
    if (!gift) throw new NotFoundError('Gift');

    const payment = await prisma.payment.findFirst({
      where: { giftId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, paymentStatus: gift.paymentStatus, payment });
  } catch (err) { next(err); }
});

// ── Get platform payment settings (public — needed for checkout page) ──────────
router.get('/settings', async (req, res, next) => {
  try {
    const [
      paymentsEnabled,
      price,
      currency,
      instapayEnabled,
      instapayAddress,
      instapayInstructions,
      vodafoneEnabled,
      vodafoneNumber,
      vodafoneInstructions,
      cardEnabled,
    ] = await Promise.all([
      getSettingValue('payments_enabled'),
      getSettingValue('payment_price'),
      getSettingValue('payment_currency'),
      getSettingValue('instapay_enabled'),
      getSettingValue('instapay_address'),
      getSettingValue('instapay_instructions'),
      getSettingValue('vodafone_cash_enabled'),
      getSettingValue('vodafone_cash_number'),
      getSettingValue('vodafone_cash_instructions'),
      getSettingValue('card_enabled'),
    ]);

    res.json({
      success: true,
      settings: {
        paymentsEnabled: paymentsEnabled === '1',
        price: parseFloat(price ?? '149'),
        currency: currency ?? 'EGP',
        instapay: {
          enabled: instapayEnabled === '1',
          address: instapayAddress,
          instructions: instapayInstructions,
        },
        vodafoneCash: {
          enabled: vodafoneEnabled === '1',
          number: vodafoneNumber,
          instructions: vodafoneInstructions,
        },
        card: { enabled: cardEnabled === '1' },
      },
    });
  } catch (err) { next(err); }
});

export default router;
