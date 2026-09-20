import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { categories } from './category';
import { footerSectionType } from './enums';
import { files } from './file';
import { pageSections } from './page-section';

export const footerSections = pgTable(
  'footer_sections',
  {
    id: serial('id').primaryKey(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => pageSections.id, { onDelete: 'cascade' }),
    type: footerSectionType('type').notNull(),
    label: text('label'),
    url: text('url'),
    description: text('description'),
    fileId: integer('file_id').references(() => files.id, { onDelete: 'restrict' }),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('footer_sections_section_id_sort_order_idx').on(table.sectionId, table.sortOrder)],
);
