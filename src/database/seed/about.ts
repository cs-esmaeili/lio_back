import { asc, eq, inArray } from 'drizzle-orm';
import { PageSectionLocation, PageSectionStatus, PageSectionType, aboutSections, pageSections } from '../schema';
import { ensureFakeImageFiles } from './fake-images';
import type { SeedDb } from './db';

export async function seedAbout(db: SeedDb): Promise<number> {
  const images = await ensureFakeImageFiles(db, 'sliders');
  const [headerImage, founderImage] = images;

  // The about section is a global section (not attached to any page). Keep a single one.
  const existing = await db.query.pageSections.findMany({
    where: eq(pageSections.type, PageSectionType.ABOUT),
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
    location: PageSectionLocation.ABOUT,
    title: 'درباره ما',
    sortOrder: 0,
    status: PageSectionStatus.ACTIVE,
  };
  const [section] = existing[0]
    ? await db.update(pageSections).set(sectionData).where(eq(pageSections.id, existing[0].id)).returning({ id: pageSections.id })
    : await db
        .insert(pageSections)
        .values({ ...sectionData, type: PageSectionType.ABOUT })
        .returning({ id: pageSections.id });

  const values = {
    sectionId: section.id,
    headerTitle: 'با لیو بیشتر آشنا شوید',
    headerDescription: '<p>لیو یک فروشگاه اینترنتی است که با هدف ساده‌تر کردن خرید آنلاین راه‌اندازی شده است.</p>',
    headerFileId: headerImage?.id ?? null,
    historyTitle: 'تاریخچه ما',
    historyDescription: '<p>مسیر ما از یک ایده کوچک شروع شد و امروز به یکی از فروشگاه‌های آنلاین مورد اعتماد تبدیل شده است.</p>',
    founderTitle: 'پیام مدیرعامل',
    founderSubtitle: 'بنیان‌گذار لیو',
    founderDescription: '<p>باور ما این است که خرید آنلاین باید ساده، مطمئن و لذت‌بخش باشد.</p>',
    founderFileId: founderImage?.id ?? headerImage?.id ?? null,
    founderSignatureFileId: null,
    statistics: [
      { title: 'مشتری راضی', description: 'از سراسر ایران', number: 10000 },
      { title: 'محصول متنوع', description: 'در دسته‌بندی‌های مختلف', number: 5000 },
      { title: 'سال تجربه', description: 'در بازار آنلاین', number: 10 },
      { title: 'پشتیبانی سریع', description: 'در تمام ساعات کاری', number: 24 },
    ],
  };

  await db.insert(aboutSections).values(values).onConflictDoUpdate({ target: aboutSections.sectionId, set: values });

  return 1;
}
