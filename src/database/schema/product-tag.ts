import { index, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { products } from './product';
import { tags } from './tag';

export const productTags = pgTable(
  'product_tags',
  {
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.productId, table.tagId], name: 'product_tags_pkey' }), index('product_tags_tag_id_idx').on(table.tagId)],
);
