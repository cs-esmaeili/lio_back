import { asc, eq, inArray, isNull } from 'drizzle-orm';
import { HeaderSectionType, PageSectionLocation, PageSectionStatus, PageSectionType, categories, headerSections, pageSections, pages } from '../schema';
import type { SeedDb } from './db';

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

export async function seedHeader(db: SeedDb): Promise<number> {
  const categoryRows = await db.query.categories.findMany({
    where: isNull(categories.parentId),
    orderBy: asc(categories.id),
    columns: { id: true },
  });
  if (categoryRows.length === 0) {
    throw new Error('No categories found. Run the "categories" seed first.');
  }

  // The header is a global section (not attached to any page). Detach and drop the
  // legacy dedicated header page, then keep a single global header section.
  const legacyPage = await db.query.pages.findFirst({ where: eq(pages.slug, LEGACY_HEADER_SLUG), columns: { id: true } });
  if (legacyPage) {
    await db.update(pageSections).set({ pageId: null }).where(eq(pageSections.pageId, legacyPage.id));
    await db.delete(pages).where(eq(pages.id, legacyPage.id));
  }

  const existing = await db.query.pageSections.findMany({
    where: eq(pageSections.type, PageSectionType.HEADER),
    orderBy: asc(pageSections.id),
    columns: { id: true },
  });
  if (existing.length > 1) {
    await db.delete(pageSections).where(
      inArray(
        pageSections.id,
        existing.slice(1).map((section) => section.id),
      ),
    );
  }

  const sectionData = {
    pageId: null,
    location: PageSectionLocation.HEADER,
    title: 'هدر سایت',
    sortOrder: 0,
    status: PageSectionStatus.ACTIVE,
  };
  const [section] = existing[0]
    ? await db.update(pageSections).set(sectionData).where(eq(pageSections.id, existing[0].id)).returning({ id: pageSections.id })
    : await db
        .insert(pageSections)
        .values({ ...sectionData, type: PageSectionType.HEADER })
        .returning({ id: pageSections.id });

  const items: HeaderItemSeed[] = [...LINK_ITEMS, ...categoryRows.map((category): HeaderItemSeed => ({ type: HeaderSectionType.CATEGORY, categoryId: category.id }))];

  await db.delete(headerSections).where(eq(headerSections.sectionId, section.id));
  await db.insert(headerSections).values(
    items.map((item, index) => ({
      sectionId: section.id,
      sortOrder: index,
      type: item.type,
      label: item.type === HeaderSectionType.LINK ? (item.label ?? null) : null,
      url: item.type === HeaderSectionType.LINK ? (item.url ?? null) : null,
      categoryId: item.type === HeaderSectionType.CATEGORY ? (item.categoryId ?? null) : null,
    })),
  );

  return items.length;
}
