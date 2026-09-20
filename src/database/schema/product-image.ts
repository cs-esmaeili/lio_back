import { boolean, index, integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { files } from './file';
import { products } from './product';

export const productImages = pgTable(
  'product_images',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    fileId: integer('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'restrict' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
    isThumbnail: boolean('is_thumbnail').default(false).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('product_images_product_id_sort_order_idx').on(table.productId, table.sortOrder), index('product_images_file_id_idx').on(table.fileId)],
);
