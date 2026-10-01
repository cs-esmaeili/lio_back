import { doublePrecision, integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { pageSections } from './page-section';

export const contactSections = pgTable(
  'contact_sections',
  {
    id: serial('id').primaryKey(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => pageSections.id, { onDelete: 'cascade' }),
    address: text('address'),
    email: text('email'),
    supportHour: text('support_hour'),
    mapLat: doublePrecision('map_lat'),
    mapLng: doublePrecision('map_lng'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('contact_sections_section_id_key').on(table.sectionId)],
);
