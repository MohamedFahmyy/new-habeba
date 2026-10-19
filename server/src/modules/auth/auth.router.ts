import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import rateLimit from 'express-rate-limit';
import { prisma } from '../../services/db.js';
import { AppError } from '../../middleware/errors.js';
import { config } from '../../config/index.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: config.rateLimits.loginWindowMs,
  max: config.rateLimits.loginMaxAttempts,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Register ────────────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  username: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(v => v === true, { message: 'You must accept the terms' }),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

router.post('/register', async (req, res, next) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await prisma.user.create({
      data: { email: data.email, username: data.username, passwordHash, role: 'user' },
    });

    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.username = user.username;
    req.session.role = user.role;

    res.status(201).json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    });
  } catch (err) { next(err); }
});

// ── Login ───────────────────────────────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const data = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    const invalidCreds = new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');

    if (!user) {
      // Constant-time dummy hash to prevent user enumeration
      await argon2.hash('dummy_password_timing_attack_prevention');
      throw invalidCreds;
    }

    const valid = await argon2.verify(user.passwordHash, data.password);
    if (!valid) throw invalidCreds;

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.username = user.username;
      req.session.role = user.role;
      res.json({
        success: true,
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
      });
    });
  } catch (err) { next(err); }
});

// ── Logout ──────────────────────────────────────────────────────────────────
router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie(config.session.name);
    res.json({ success: true });
  });
});

// ── Me (current user) ───────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.session?.userId) {
    return res.json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    user: {
      id: req.session.userId,
      email: req.session.userEmail,
      username: req.session.username,
      role: req.session.role,
    },
  });
});

export default router;
