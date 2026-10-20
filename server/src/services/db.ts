import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function ensureInitialData() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      logger.info('No users found in database. Initializing default admin and platform settings...');
      const settings = [
        { settingKey: 'payments_enabled', settingValue: '0' },
        { settingKey: 'payment_price', settingValue: '149' },
        { settingKey: 'payment_currency', settingValue: 'EGP' },
        { settingKey: 'instapay_enabled', settingValue: '1' },
        { settingKey: 'instapay_address', settingValue: 'habeba@instapay' },
        { settingKey: 'instapay_instructions', settingValue: 'حول المبلغ عبر تطبيق انستاباي إلى العنوان أعلاه، ثم اكتب رقم العملية وارفع صورة الإيصال.' },
        { settingKey: 'vodafone_cash_enabled', settingValue: '1' },
        { settingKey: 'vodafone_cash_number', settingValue: '01000000000' },
        { settingKey: 'vodafone_cash_instructions', settingValue: 'حول المبلغ كاش إلى الرقم أعلاه، ثم اكتب رقم المحفظة المحول منها وارفع صورة الإيصال.' },
        { settingKey: 'card_enabled', settingValue: '0' },
        { settingKey: 'require_manual_review', settingValue: '1' },
      ];
      for (const s of settings) {
        await prisma.platformSetting.upsert({
          where: { settingKey: s.settingKey },
          update: {},
          create: s,
        });
      }

      const argon2 = (await import('argon2')).default;
      const adminPasswordHash = await argon2.hash(process.env.ADMIN_PASSWORD || 'romantic2026', {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });

      await prisma.user.create({
        data: {
          email: 'admin@habeba.com',
          username: 'Habeba Admin',
          passwordHash: adminPasswordHash,
          role: 'admin',
        },
      });

      logger.info('✅ Initial admin user and settings created successfully.');
    }
  } catch (err) {
    logger.warn('Failed to ensure initial data:', { error: String(err) });
  }
}

export async function connectDb() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    await ensureInitialData();
  } catch (err) {
    logger.error('Failed to connect to database', { error: String(err) });
    process.exit(1);
  }
}
