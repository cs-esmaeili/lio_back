import { boolean, integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { entityType } from './enums';

export const pages = pgTable(
  'pages',
  {
    id: serial('id').primaryKey(),
    entityType: entityType('entity_type').notNull(),
    entityId: integer('entity_id'),
    slug: text('slug'),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    canonicalUrl: text('canonical_url'),
    robotsIndex: boolean('robots_index').default(true).notNull(),
    robotsFollow: boolean('robots_follow').default(true).notNull(),
    ogTitle: text('og_title'),
    ogDescription: text('og_description'),
    ogType: text('og_type').default('website').notNull(),
    ogImage: text('og_image'),
    twitterCard: text('twitter_card'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('pages_slug_key').on(table.slug), uniqueIndex('pages_entity_type_entity_id_key').on(table.entityType, table.entityId)],
);
