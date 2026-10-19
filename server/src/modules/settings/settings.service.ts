import { prisma } from '../../services/db.js';

export async function getSettingValue(key: string): Promise<string | null> {
  const setting = await prisma.platformSetting.findUnique({ where: { settingKey: key } });
  return setting?.settingValue ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.platformSetting.findMany();
  return Object.fromEntries(settings.map(s => [s.settingKey, s.settingValue ?? '']));
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.platformSetting.upsert({
    where: { settingKey: key },
    update: { settingValue: value },
    create: { settingKey: key, settingValue: value },
  });
}
