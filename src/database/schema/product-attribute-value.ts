import { index, integer, pgTable, serial, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { attributes } from './attribute';
import { attributeValues } from './attribute-value';
import { products } from './product';

export const productAttributeValues = pgTable(
  'product_attribute_values',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    attributeId: integer('attribute_id')
      .notNull()
      .references(() => attributes.id, { onDelete: 'cascade' }),
    attributeValueId: integer('attribute_value_id')
      .notNull()
      .references(() => attributeValues.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('product_attribute_values_product_id_attribute_id_value_id_key').on(table.productId, table.attributeId, table.attributeValueId),
    index('product_attribute_values_attribute_id_idx').on(table.attributeId),
    index('product_attribute_values_attribute_value_id_idx').on(table.attributeValueId),
  ],
);
