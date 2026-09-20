import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  data: jsonb('data').$type<Record<string, unknown>>().notNull(),
  isPrivate: boolean('is_private').default(false).notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});
