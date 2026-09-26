import { boolean, index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { locations } from './location';
import { users } from './user';

export const addresses = pgTable(
  'addresses',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    address: text('address').notNull(),
    postalCode: text('postal_code').notNull(),
    isMain: boolean('is_main').default(false).notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    locationId: integer('location_id')
      .notNull()
      .references(() => locations.id),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('addresses_user_id_idx').on(table.userId), index('addresses_location_id_idx').on(table.locationId)],
);
