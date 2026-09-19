import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const files = pgTable(
  'files',
  {
    id: serial('id').primaryKey(),
    originalName: text('original_name').notNull(),
    storedName: text('stored_name').notNull(),
    path: text('path').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    uploaderId: integer('uploader_id'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('files_stored_name_key').on(table.storedName), index('files_uploader_id_idx').on(table.uploaderId)],
);
