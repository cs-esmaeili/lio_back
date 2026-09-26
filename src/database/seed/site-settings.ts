import { siteSettings } from '../schema';
import type { SeedDb } from './db';

interface SiteSettingSeed {
  key: string;
  data: Record<string, unknown>;
  isPrivate: boolean;
}

const SITE_SETTINGS: SiteSettingSeed[] = [
  {
    key: 'logo',
    data: {
      small: '/uploads/statics/logo-small.png',
      large: '/uploads/statics/logo-large.png',
    },
    isPrivate: false,
  },
  {
    key: 'description',
    data: {
      value: 'فروشگاه اینترنتی لیو؛ تجربهٔ خرید آنلاین سریع، مطمئن و مقرون‌به‌صرفه.',
    },
    isPrivate: false,
  },
  {
    key: 'slogan',
    data: {
      value: 'لیو؛ ساده‌تر خرید کن.',
    },
    isPrivate: false,
  },
  {
    key: 'supportPhone',
    data: {
      value: '021-12345678',
    },
    isPrivate: false,
  },
  {
    key: 'shipping',
    data: {
      enabled: true,
      cost: 0,
      freeOver: 0,
    },
    isPrivate: false,
  },
];

export async function seedSiteSettings(db: SeedDb): Promise<number> {
  for (const setting of SITE_SETTINGS) {
    await db
      .insert(siteSettings)
      .values(setting)
      .onConflictDoUpdate({ target: siteSettings.key, set: { data: setting.data, isPrivate: setting.isPrivate } });
  }

  return SITE_SETTINGS.length;
}
