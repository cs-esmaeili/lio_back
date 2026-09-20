import { index, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { categories } from './category';
import { products } from './product';

export const productCategories = pgTable(
  'product_categories',
  {
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.productId, table.categoryId], name: 'product_categories_pkey' }), index('product_categories_category_id_idx').on(table.categoryId)],
);
