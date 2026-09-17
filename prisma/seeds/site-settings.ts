import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';

interface SiteSettingSeed {
  key: string;
  data: Prisma.InputJsonObject;
  isPrivate: boolean;
}

const SITE_SETTINGS: SiteSettingSeed[] = [
  {
    key: 'logo',
    data: {
      small: '/uploads/images/logo-small.svg',
      large: '/uploads/images/logo-large.svg',
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
];

export async function seedSiteSettings(prisma: PrismaClient): Promise<number> {
  for (const setting of SITE_SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: { data: setting.data, isPrivate: setting.isPrivate },
    });
  }

  return SITE_SETTINGS.length;
}
