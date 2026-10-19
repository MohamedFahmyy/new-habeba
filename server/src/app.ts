import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errors.js';

// Routers
import authRouter from './modules/auth/auth.router.js';
import giftsRouter from './modules/gifts/gifts.router.js';
import uploadsRouter from './modules/uploads/uploads.router.js';
import paymentsRouter from './modules/payments/payments.router.js';
import adminRouter from './modules/admin/admin.router.js';

// ── Session store (SQLite-backed in dev, Redis-ready for prod) ─────────────────
let sessionStore: session.Store | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ConnectSQLite3 = require('connect-sqlite3')(session);
  sessionStore = new ConnectSQLite3({
    db: 'sessions.db',
    dir: path.resolve(__dirname, '../../storage'),
  });
} catch {
  logger.warn('connect-sqlite3 not available, using memory session store (not for production)');
}

export function createApp() {
  const app = express();

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploaded files
  }));

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // ── Logging ───────────────────────────────────────────────────────────────
  app.use(morgan(config.isDevelopment ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));

  // ── Session ───────────────────────────────────────────────────────────────
  app.use(session({
    name: config.session.name,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'strict' : 'lax',
      maxAge: config.session.maxAgeMs,
    },
  }));

  // ── Global rate limit ─────────────────────────────────────────────────────
  app.use('/api', rateLimit({
    windowMs: config.rateLimits.apiWindowMs,
    max: config.rateLimits.apiMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // ── Static file serving for uploads ──────────────────────────────────────
  // Public uploads served via the /api/uploads route with auth check

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRouter);
  app.use('/api/gifts', giftsRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/admin', adminRouter);

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'API route not found' });
  });

  // ── Production static client serving (SPA fallback) ──────────────────────
  if (config.isProduction) {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // ── Centralized error handler ─────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
