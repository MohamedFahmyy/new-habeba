import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/auth.js';
import { prisma } from '../../services/db.js';
import { NotFoundError, AppError } from '../../middleware/errors.js';
import { getAllSettings, setSetting } from '../settings/settings.service.js';

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// ── Statistics ────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalGifts, totalPublished, pendingPayments, totalViews] = await Promise.all([
      prisma.user.count(),
      prisma.gift.count(),
      prisma.gift.count({ where: { status: 'published' } }),
      prisma.payment.count({ where: { status: 'awaiting_review' } }),
      prisma.gift.aggregate({ _sum: { viewsCount: true } }),
    ]);
    res.json({ success: true, stats: { totalUsers, totalGifts, totalPublished, pendingPayments, totalViews: totalViews._sum.viewsCount ?? 0 } });
  } catch (err) { next(err); }
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true, role: true, createdAt: true, _count: { select: { gifts: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, users });
  } catch (err) { next(err); }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (id === req.session.userId) throw new AppError(400, 'Cannot delete your own account', 'SELF_DELETE');
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── All Gifts ─────────────────────────────────────────────────────────────────
router.get('/gifts', async (req, res, next) => {
  try {
    const gifts = await prisma.gift.findMany({
      include: { user: { select: { id: true, email: true, username: true } }, _count: { select: { memories: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, gifts });
  } catch (err) { next(err); }
});

router.delete('/gifts/:id', async (req, res, next) => {
  try {
    await prisma.gift.delete({ where: { id: parseInt(String(req.params.id), 10) } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Payment Queue ─────────────────────────────────────────────────────────────
router.get('/payments', async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: { select: { id: true, email: true, username: true } },
        gift: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, payments });
  } catch (err) { next(err); }
});

// ── Approve payment ───────────────────────────────────────────────────────────
router.post('/payments/:id/approve', async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundError('Payment');

    await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: { status: 'approved', reviewedById: req.session.userId, reviewedAt: new Date(), adminNotes: req.body.notes },
      }),
      prisma.gift.update({
        where: { id: payment.giftId },
        data: { paymentStatus: 'paid', status: 'published' },
      }),
      prisma.order.updateMany({
        where: { giftId: payment.giftId },
        data: { status: 'paid' },
      }),
    ]);

    res.json({ success: true, message: 'Payment approved and gift published' });
  } catch (err) { next(err); }
});

// ── Reject payment ────────────────────────────────────────────────────────────
router.post('/payments/:id/reject', async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundError('Payment');

    await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: { status: 'rejected', reviewedById: req.session.userId, reviewedAt: new Date(), adminNotes: req.body.notes },
      }),
      prisma.gift.update({
        where: { id: payment.giftId },
        data: { paymentStatus: 'free' }, // Reset so user can retry
      }),
    ]);

    res.json({ success: true, message: 'Payment rejected' });
  } catch (err) { next(err); }
});

// ── Platform Settings (read/write) ────────────────────────────────────────────
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await getAllSettings();
    res.json({ success: true, settings });
  } catch (err) { next(err); }
});

const SettingsUpdateSchema = z.object({
  payments_enabled: z.enum(['0', '1']).optional(),
  payment_price: z.string().optional(),
  payment_currency: z.string().max(10).optional(),
  instapay_enabled: z.enum(['0', '1']).optional(),
  instapay_address: z.string().max(255).optional(),
  instapay_instructions: z.string().optional(),
  vodafone_cash_enabled: z.enum(['0', '1']).optional(),
  vodafone_cash_number: z.string().max(20).optional(),
  vodafone_cash_instructions: z.string().optional(),
  card_enabled: z.enum(['0', '1']).optional(),
  require_manual_review: z.enum(['0', '1']).optional(),
});

router.patch('/settings', async (req, res, next) => {
  try {
    const data = SettingsUpdateSchema.parse(req.body);
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) await setSetting(key, value);
    }
    const settings = await getAllSettings();
    res.json({ success: true, settings });
  } catch (err) { next(err); }
});

export default router;
