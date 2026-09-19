import { type AnyPgColumn, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { files } from './file';

export const tags = pgTable(
  'tags',
  {
    id: serial('id').primaryKey(),
    parentId: integer('parent_id').references((): AnyPgColumn => tags.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    imageId: integer('image_id').references(() => files.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('tags_slug_key').on(table.slug), index('tags_parent_id_idx').on(table.parentId), index('tags_image_id_idx').on(table.imageId)],
);
