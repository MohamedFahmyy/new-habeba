import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { prisma } from '../src/services/db.js';

async function migrateFromPhp() {
  const phpDbPath = path.resolve(__dirname, '../../../data/romantic_platform.sqlite');
  console.log(`🔍 Inspecting original PHP SQLite database at: ${phpDbPath}`);

  let db: DatabaseSync;
  try {
    db = new DatabaseSync(phpDbPath, { readOnly: true, open: true });
  } catch (err) {
    console.warn(`Original PHP database not found at ${phpDbPath}. Skipping import.`);
    return;
  }

  // Get table list
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
  console.log('Found tables in original PHP database:', tables.map(t => t.name).join(', '));

  // Migrate platform settings if exists
  if (tables.some(t => t.name === 'platform_settings')) {
    const settings = db.prepare('SELECT * FROM platform_settings').all() as any[];
    console.log(`Found ${settings.length} platform settings in PHP database.`);
    for (const s of settings) {
      const key = s.setting_key || s.settingKey;
      const val = s.setting_value !== undefined ? String(s.setting_value) : s.settingValue;
      if (key) {
        await prisma.platformSetting.upsert({
          where: { settingKey: key },
          update: { settingValue: val },
          create: { settingKey: key, settingValue: val },
        });
      }
    }
  }

  // Check users table
  if (tables.some(t => t.name === 'users')) {
    const users = db.prepare('SELECT * FROM users').all() as any[];
    console.log(`Found ${users.length} users in PHP database.`);
  }

  // Check gift_websites table
  if (tables.some(t => t.name === 'gift_websites')) {
    const gifts = db.prepare('SELECT * FROM gift_websites').all() as any[];
    console.log(`Found ${gifts.length} gift websites in PHP database.`);
  }

  console.log('✅ PHP database inspection / safe import complete without any destructive modifications.');
}

migrateFromPhp()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
