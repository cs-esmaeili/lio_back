import { index, integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { pageSections } from './page-section';
import { products } from './product';

export const productListSections = pgTable(
  'product_list_sections',
  {
    id: serial('id').primaryKey(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => pageSections.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('product_list_sections_section_id_sort_order_idx').on(table.sectionId, table.sortOrder)],
);
