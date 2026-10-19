import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { prisma } from '../../services/db.js';
import { requireAuth } from '../../middleware/auth.js';
import { ForbiddenError, NotFoundError, AppError } from '../../middleware/errors.js';
import { getSettingValue } from '../settings/settings.service.js';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateSlug(sender: string, recipient: string): string {
  const base = slugify(`${sender}-and-${recipient}`, { lower: true, strict: true });
  return `${base}-${Date.now().toString(36)}`;
}

function assertOwnership(gift: { userId: number | null }, userId?: number) {
  if (!userId || gift.userId !== userId) throw new ForbiddenError('You do not own this gift');
}

const toId = (param: string | string[] | undefined): number => parseInt(String(param), 10);

// ── List user gifts ───────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const gifts = await prisma.gift.findMany({
      where: { userId: req.session.userId },
      include: { memories: { take: 1, orderBy: { sortOrder: 'asc' } }, _count: { select: { memories: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, gifts });
  } catch (err) { next(err); }
});

// ── Get single gift (owner or published) ─────────────────────────────────────
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const gift = await prisma.gift.findFirst({
      where: { id: toId(req.params.id) },
      include: { memories: { orderBy: { sortOrder: 'asc' } }, timelineEntries: { orderBy: { sortOrder: 'asc' } }, counters: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!gift) throw new NotFoundError('Gift');
    assertOwnership(gift, req.session.userId);
    res.json({ success: true, gift });
  } catch (err) { next(err); }
});

// ── Public gift by slug ───────────────────────────────────────────────────────
router.get('/public/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug);
    const gift = await prisma.gift.findUnique({
      where: { slug },
      include: { memories: { orderBy: { sortOrder: 'asc' } }, timelineEntries: { orderBy: { sortOrder: 'asc' } }, counters: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!gift) throw new NotFoundError('Gift');
    if (gift.status !== 'published') throw new NotFoundError('Gift'); // don't reveal draft existence

    // Check payment gate
    const paymentsEnabled = (await getSettingValue('payments_enabled')) === '1';
    if (paymentsEnabled && gift.paymentStatus !== 'paid' && gift.paymentStatus !== 'free') {
      throw new AppError(402, 'This gift is not yet activated', 'PAYMENT_REQUIRED');
    }

    // Increment view count (fire-and-forget)
    prisma.gift.update({ where: { id: gift.id }, data: { viewsCount: { increment: 1 } } }).catch(() => {});

    res.json({ success: true, gift });
  } catch (err) { next(err); }
});

// ── Create gift ───────────────────────────────────────────────────────────────
const GiftCreateSchema = z.object({
  title: z.string().min(1).max(255),
  senderName: z.string().min(1).max(100),
  recipientName: z.string().min(1).max(100),
  welcomeMessage: z.string().max(1000).optional(),
  themeId: z.string().default('midnight'),
  galleryStyle: z.enum(['masonry', 'polaroid', 'grid']).default('masonry'),
  musicUrl: z.string().url().optional().or(z.literal('')),
  musicVideoId: z.string().max(50).optional(),
  musicTitle: z.string().max(255).optional(),
  letterTitle: z.string().max(255).optional(),
  letterContent: z.string().optional(),
  letterSignature: z.string().max(100).optional(),
  surpriseTitle: z.string().max(255).optional(),
  surpriseMessage: z.string().optional(),
  anniversaryDate: z.string().optional(),
  slug: z.string().max(120).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  showTimeline: z.boolean().default(true),
  showGallery: z.boolean().default(true),
  showLetter: z.boolean().default(true),
  showCounters: z.boolean().default(true),
  showSurprise: z.boolean().default(true),
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = GiftCreateSchema.parse(req.body);
    const slug = data.slug || generateSlug(data.senderName, data.recipientName);
    const editToken = uuidv4();

    const gift = await prisma.gift.create({
      data: { ...data, slug, editToken, userId: req.session.userId, paymentStatus: 'free' },
    });

    res.status(201).json({ success: true, gift });
  } catch (err) { next(err); }
});

// ── Update gift ───────────────────────────────────────────────────────────────
const GiftUpdateSchema = GiftCreateSchema.partial();

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const existing = await prisma.gift.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Gift');
    assertOwnership(existing, req.session.userId);

    const data = GiftUpdateSchema.parse(req.body);

    // Payment gate check for publishing
    if (data.status === 'published') {
      const paymentsEnabled = (await getSettingValue('payments_enabled')) === '1';
      if (paymentsEnabled && existing.paymentStatus !== 'paid' && existing.paymentStatus !== 'free') {
        throw new AppError(402, 'Payment required before publishing', 'PAYMENT_REQUIRED');
      }
    }

    const gift = await prisma.gift.update({ where: { id }, data });
    res.json({ success: true, gift });
  } catch (err) { next(err); }
});

// ── Delete gift ───────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const existing = await prisma.gift.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Gift');
    assertOwnership(existing, req.session.userId);

    await prisma.gift.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Duplicate gift ────────────────────────────────────────────────────────────
router.post('/:id/duplicate', requireAuth, async (req, res, next) => {
  try {
    const id = toId(req.params.id);
    const original = await prisma.gift.findUnique({
      where: { id },
      include: { memories: true, timelineEntries: true, counters: true },
    });
    if (!original) throw new NotFoundError('Gift');
    assertOwnership(original, req.session.userId);

    const newSlug = `${original.slug}-copy-${Date.now().toString(36)}`;
    const { id: _id, createdAt, updatedAt, viewsCount, ...rest } = original;

    const newGift = await prisma.gift.create({
      data: {
        ...rest,
        slug: newSlug,
        editToken: uuidv4(),
        title: `${original.title} (Copy)`,
        status: 'draft',
        paymentStatus: 'free',
        memories: { create: original.memories.map(({ id: _mid, giftId: _gid, createdAt: _ca, ...m }) => m) },
        timelineEntries: { create: original.timelineEntries.map(({ id: _tid, giftId: _gid, createdAt: _ca, ...t }) => t) },
        counters: { create: original.counters.map(({ id: _cid, giftId: _gid, ...c }) => c) },
      },
    });

    res.status(201).json({ success: true, gift: newGift });
  } catch (err) { next(err); }
});

// ── Memory CRUD ───────────────────────────────────────────────────────────────
const MemorySchema = z.object({
  imageUrl: z.string().min(1),
  title: z.string().max(255).optional(),
  caption: z.string().optional(),
  memoryDate: z.string().max(50).optional(),
  sortOrder: z.number().int().default(0),
});

router.post('/:id/memories', requireAuth, async (req, res, next) => {
  try {
    const giftId = toId(req.params.id);
    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) throw new NotFoundError('Gift');
    assertOwnership(gift, req.session.userId);
    const data = MemorySchema.parse(req.body);
    const memory = await prisma.memory.create({ data: { ...data, giftId } });
    res.status(201).json({ success: true, memory });
  } catch (err) { next(err); }
});

router.delete('/:id/memories/:memId', requireAuth, async (req, res, next) => {
  try {
    const giftId = toId(req.params.id);
    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) throw new NotFoundError('Gift');
    assertOwnership(gift, req.session.userId);
    await prisma.memory.delete({ where: { id: toId(req.params.memId), giftId } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Timeline CRUD ─────────────────────────────────────────────────────────────
const TimelineSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  eventDate: z.string().max(50).optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

router.post('/:id/timeline', requireAuth, async (req, res, next) => {
  try {
    const giftId = toId(req.params.id);
    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) throw new NotFoundError('Gift');
    assertOwnership(gift, req.session.userId);
    const data = TimelineSchema.parse(req.body);
    const entry = await prisma.timelineEntry.create({ data: { ...data, giftId } });
    res.status(201).json({ success: true, entry });
  } catch (err) { next(err); }
});

router.delete('/:id/timeline/:entryId', requireAuth, async (req, res, next) => {
  try {
    const giftId = toId(req.params.id);
    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) throw new NotFoundError('Gift');
    assertOwnership(gift, req.session.userId);
    await prisma.timelineEntry.delete({ where: { id: toId(req.params.entryId), giftId } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
