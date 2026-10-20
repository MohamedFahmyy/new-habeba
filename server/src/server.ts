import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDb } from './services/db.js';
import { logger } from './utils/logger.js';

async function start() {
  // Validate required environment
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is required. Copy .env.example to .env and configure it.');
    process.exit(1);
  }

  await connectDb();

  const app = createApp();

  const host = '0.0.0.0';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : config.port;

  const server = app.listen(port, host, () => {
    logger.info(`🚀 Habeba API server running on http://${host}:${port}`);
    logger.info(`   Environment: ${config.env}`);
    logger.info(`   Client URL:  ${config.clientUrl}`);
    logger.info(`   DB Provider: ${config.database.provider}`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => { process.exit(1); }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
