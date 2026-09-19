import { boolean, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { attributeUsage, filterType } from './enums';

export const attributes = pgTable(
  'attributes',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    title: text('title').notNull(),
    usage: attributeUsage('usage').default('SPEC').notNull(),
    filterType: filterType('filter_type').default('CHECKBOX').notNull(),
    isMultiSelect: boolean('is_multi_select').default(true).notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('attributes_name_key').on(table.name)],
);
