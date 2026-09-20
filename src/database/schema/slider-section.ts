import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { files } from './file';
import { pageSections } from './page-section';

export const sliderSections = pgTable(
  'slider_sections',
  {
    id: serial('id').primaryKey(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => pageSections.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0).notNull(),
    desktopFileId: integer('desktop_file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'restrict' }),
    tabletFileId: integer('tablet_file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'restrict' }),
    mobileFileId: integer('mobile_file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'restrict' }),
    url: text('url'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('slider_sections_section_id_sort_order_idx').on(table.sectionId, table.sortOrder)],
);
