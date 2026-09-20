import { integer, jsonb, pgTable, serial, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { files } from './file';
import { pageSections } from './page-section';

export const introductionSections = pgTable(
  'introduction_sections',
  {
    id: serial('id').primaryKey(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => pageSections.id, { onDelete: 'cascade' }),
    titles: jsonb('titles').$type<Record<string, unknown>>().default({}).notNull(),
    desktopFileId: integer('desktop_file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'restrict' }),
    tabletFileId: integer('tablet_file_id').references(() => files.id, { onDelete: 'restrict' }),
    mobileFileId: integer('mobile_file_id').references(() => files.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('introduction_sections_section_id_key').on(table.sectionId)],
);
