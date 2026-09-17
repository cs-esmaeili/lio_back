import { FooterSectionType, PageSectionLocation, PageSectionStatus, PageSectionType } from '../../src/generated/prisma/client';
import type { PrismaClient } from '../../src/generated/prisma/client';
import { ensureFakeImageFiles } from './fake-images';

interface FooterLinkSeed {
  label: string;
  url: string;
  description?: string;
}

const LINK_ITEMS: FooterLinkSeed[] = [
  { label: 'درباره ما', url: '/about', description: 'آشنایی بیشتر با فروشگاه لیو' },
  { label: 'تماس با ما', url: '/contact', description: 'راه‌های ارتباطی با پشتیبانی' },
  { label: 'قوانین و مقررات', url: '/terms', description: 'شرایط استفاده از خدمات فروشگاه' },
];

interface FooterItemSeed {
  type: FooterSectionType;
  label: string | null;
  url: string | null;
  description: string | null;
  fileId: number | null;
  categoryId: number | null;
}

export async function seedFooter(prisma: PrismaClient): Promise<number> {
  const [image] = await ensureFakeImageFiles(prisma, 'sliders');

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  // The footer is a global section (not attached to any page). Keep a single footer section.
  const existing = await prisma.pageSection.findMany({
    where: { type: PageSectionType.FOOTER },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (existing.length > 1) {
    await prisma.pageSection.deleteMany({ where: { id: { in: existing.slice(1).map((section) => section.id) } } });
  }

  const sectionData = {
    pageId: null,
    location: PageSectionLocation.FOOTER,
    title: 'فوتر سایت',
    sortOrder: 0,
    status: PageSectionStatus.ACTIVE,
  };
  const section = existing[0]
    ? await prisma.pageSection.update({ where: { id: existing[0].id }, data: sectionData, select: { id: true } })
    : await prisma.pageSection.create({ data: { ...sectionData, type: PageSectionType.FOOTER }, select: { id: true } });

  const items: FooterItemSeed[] = [
    ...LINK_ITEMS.map((link): FooterItemSeed => ({
      type: FooterSectionType.LINK,
      label: link.label,
      url: link.url,
      description: link.description ?? null,
      fileId: image.id,
      categoryId: null,
    })),
    ...categories.map((category): FooterItemSeed => ({
      type: FooterSectionType.CATEGORY,
      label: null,
      url: null,
      description: null,
      fileId: null,
      categoryId: category.id,
    })),
  ];

  await prisma.footerSection.deleteMany({ where: { sectionId: section.id } });
  await prisma.footerSection.createMany({
    data: items.map((item, index) => ({ sectionId: section.id, sortOrder: index, ...item })),
  });

  return items.length;
}
