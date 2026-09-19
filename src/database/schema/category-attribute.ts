import { boolean, index, integer, pgTable, serial, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { attributes } from './attribute';
import { categories } from './category';

export const categoryAttributes = pgTable(
  'category_attributes',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    attributeId: integer('attribute_id')
      .notNull()
      .references(() => attributes.id, { onDelete: 'cascade' }),
    isRequired: boolean('is_required').default(false).notNull(),
    isFilterable: boolean('is_filterable').default(false).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('category_attributes_category_id_attribute_id_key').on(table.categoryId, table.attributeId),
    index('category_attributes_attribute_id_idx').on(table.attributeId),
  ],
);
