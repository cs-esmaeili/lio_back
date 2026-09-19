import { index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const locations = pgTable(
  'locations',
  {
    id: serial('id').primaryKey(),
    province: text('province').notNull(),
    city: text('city').notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('locations_province_city_idx').on(table.province, table.city)],
);
