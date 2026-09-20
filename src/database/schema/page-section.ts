import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { pageSectionLocation, pageSectionStatus, pageSectionType } from './enums';
import { pages } from './page';

export const pageSections = pgTable(
  'page_sections',
  {
    id: serial('id').primaryKey(),
    pageId: integer('page_id').references(() => pages.id, { onDelete: 'cascade' }),
    type: pageSectionType('type').notNull(),
    location: pageSectionLocation('location').notNull(),
    title: text('title'),
    link: text('link'),
    sortOrder: integer('sort_order').notNull(),
    status: pageSectionStatus('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('page_sections_page_id_status_sort_order_idx').on(table.pageId, table.status, table.sortOrder)],
);
