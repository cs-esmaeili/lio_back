import { asc, eq, inArray } from 'drizzle-orm';
import { PageSectionLocation, PageSectionStatus, PageSectionType, contactSections, pageSections } from '../schema';
import type { SeedDb } from './db';

export async function seedContact(db: SeedDb): Promise<number> {
  // The contact section is a global section (not attached to any page). Keep a single contact section.
  const existing = await db.query.pageSections.findMany({
    where: eq(pageSections.type, PageSectionType.CONTACT),
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
    location: PageSectionLocation.CONTACT,
    title: 'تماس با ما',
    sortOrder: 0,
    status: PageSectionStatus.ACTIVE,
  };
  const [section] = existing[0]
    ? await db.update(pageSections).set(sectionData).where(eq(pageSections.id, existing[0].id)).returning({ id: pageSections.id })
    : await db
        .insert(pageSections)
        .values({ ...sectionData, type: PageSectionType.CONTACT })
        .returning({ id: pageSections.id });

  const values = {
    sectionId: section.id,
    address: 'اصفهان، خیابان چهارباغ، ...',
    email: 'info@liobrand.ir',
    supportHour: 'شنبه تا چهارشنبه ۹ تا ۱۸',
    mapLat: 32.655599,
    mapLng: 51.699845,
  };

  await db.insert(contactSections).values(values).onConflictDoUpdate({ target: contactSections.sectionId, set: values });

  return 1;
}
