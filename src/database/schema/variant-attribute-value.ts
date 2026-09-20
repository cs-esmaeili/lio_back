import { index, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { productAttributeValues } from './product-attribute-value';
import { productVariants } from './product-variant';

export const variantAttributeValues = pgTable(
  'variant_attribute_values',
  {
    variantId: integer('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    productAttributeValueId: integer('product_attribute_value_id')
      .notNull()
      .references(() => productAttributeValues.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.variantId, table.productAttributeValueId], name: 'variant_attribute_values_pkey' }),
    index('variant_attribute_values_product_attribute_value_id_idx').on(table.productAttributeValueId),
  ],
);
