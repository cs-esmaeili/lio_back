import { HeaderSectionType, PageSectionLocation, PageSectionStatus, PageSectionType } from '../../src/generated/prisma/client';
import type { PrismaClient } from '../../src/generated/prisma/client';

const LEGACY_HEADER_SLUG = 'header';

interface HeaderItemSeed {
  type: HeaderSectionType;
  label?: string;
  url?: string;
  categoryId?: number;
}

const LINK_ITEMS: HeaderItemSeed[] = [
  { type: HeaderSectionType.LINK, label: 'پیگیری سفارش', url: '/order-tracking' },
  { type: HeaderSectionType.LINK, label: 'خانه', url: '/' },
  { type: HeaderSectionType.LINK, label: 'تماس با ما', url: '/contact' },
];

export async function seedHeader(prisma: PrismaClient): Promise<number> {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (categories.length === 0) {
    throw new Error('No categories found. Run the "categories" seed first.');
  }

  // The header is a global section (not attached to any page). Detach and drop the
  // legacy dedicated header page, then keep a single global header section.
  await prisma.pageSection.updateMany({ where: { page: { slug: LEGACY_HEADER_SLUG } }, data: { pageId: null } });
  await prisma.page.deleteMany({ where: { slug: LEGACY_HEADER_SLUG } });

  const existing = await prisma.pageSection.findMany({
    where: { type: PageSectionType.HEADER },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (existing.length > 1) {
    await prisma.pageSection.deleteMany({ where: { id: { in: existing.slice(1).map((section) => section.id) } } });
  }

  const sectionData = {
    pageId: null,
    location: PageSectionLocation.HEADER,
    title: 'هدر سایت',
    sortOrder: 0,
    status: PageSectionStatus.ACTIVE,
  };
  const section = existing[0]
    ? await prisma.pageSection.update({ where: { id: existing[0].id }, data: sectionData, select: { id: true } })
    : await prisma.pageSection.create({ data: { ...sectionData, type: PageSectionType.HEADER }, select: { id: true } });

  const items: HeaderItemSeed[] = [...LINK_ITEMS, ...categories.map((category): HeaderItemSeed => ({ type: HeaderSectionType.CATEGORY, categoryId: category.id }))];

  await prisma.headerSection.deleteMany({ where: { sectionId: section.id } });
  await prisma.headerSection.createMany({
    data: items.map((item, index) => ({
      sectionId: section.id,
      sortOrder: index,
      type: item.type,
      label: item.type === HeaderSectionType.LINK ? (item.label ?? null) : null,
      url: item.type === HeaderSectionType.LINK ? (item.url ?? null) : null,
      categoryId: item.type === HeaderSectionType.CATEGORY ? (item.categoryId ?? null) : null,
    })),
  });

  return items.length;
}
