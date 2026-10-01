import { index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const contactForms = pgTable(
  'contact_forms',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [index('contact_forms_created_at_idx').on(table.createdAt)],
);
