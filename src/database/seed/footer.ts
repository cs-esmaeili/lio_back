import { asc, eq, inArray, isNull } from 'drizzle-orm';
import { FooterSectionType, PageSectionLocation, PageSectionStatus, PageSectionType, categories, footerSections, pageSections } from '../schema';
import { ensureFakeImageFiles } from './fake-images';
import type { SeedDb } from './db';

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

export async function seedFooter(db: SeedDb): Promise<number> {
  const [image] = await ensureFakeImageFiles(db, 'sliders');

  const categoryRows = await db.query.categories.findMany({
    where: isNull(categories.parentId),
    orderBy: asc(categories.id),
    columns: { id: true },
  });

  // The footer is a global section (not attached to any page). Keep a single footer section.
  const existing = await db.query.pageSections.findMany({
    where: eq(pageSections.type, PageSectionType.FOOTER),
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
    location: PageSectionLocation.FOOTER,
    title: 'فوتر سایت',
    sortOrder: 0,
    status: PageSectionStatus.ACTIVE,
  };
  const [section] = existing[0]
    ? await db.update(pageSections).set(sectionData).where(eq(pageSections.id, existing[0].id)).returning({ id: pageSections.id })
    : await db
        .insert(pageSections)
        .values({ ...sectionData, type: PageSectionType.FOOTER })
        .returning({ id: pageSections.id });

  const items: FooterItemSeed[] = [
    ...LINK_ITEMS.map((link): FooterItemSeed => ({
      type: FooterSectionType.LINK,
      label: link.label,
      url: link.url,
      description: link.description ?? null,
      fileId: image.id,
      categoryId: null,
    })),
    ...categoryRows.map((category): FooterItemSeed => ({
      type: FooterSectionType.CATEGORY,
      label: null,
      url: null,
      description: null,
      fileId: null,
      categoryId: category.id,
    })),
  ];

  await db.delete(footerSections).where(eq(footerSections.sectionId, section.id));
  await db.insert(footerSections).values(items.map((item, index) => ({ sectionId: section.id, sortOrder: index, ...item })));

  return items.length;
}
