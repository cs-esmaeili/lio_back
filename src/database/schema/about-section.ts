import { integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { files } from './file';
import { pageSections } from './page-section';

/** A single counter/statistic shown on the about page. */
export type AboutStatisticRecord = {
  title: string;
  description: string;
  number: number;
};

export const aboutSections = pgTable(
  'about_sections',
  {
    id: serial('id').primaryKey(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => pageSections.id, { onDelete: 'cascade' }),
    // Header block
    headerTitle: text('header_title'),
    headerDescription: text('header_description'),
    headerFileId: integer('header_file_id').references(() => files.id, { onDelete: 'restrict' }),
    // History block
    historyTitle: text('history_title'),
    historyDescription: text('history_description'),
    // Founder block
    founderTitle: text('founder_title'),
    founderSubtitle: text('founder_subtitle'),
    founderDescription: text('founder_description'),
    founderFileId: integer('founder_file_id').references(() => files.id, { onDelete: 'restrict' }),
    founderSignatureFileId: integer('founder_signature_file_id').references(() => files.id, { onDelete: 'restrict' }),
    // Counter block
    statistics: jsonb('statistics').$type<AboutStatisticRecord[]>().default([]).notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('about_sections_section_id_key').on(table.sectionId)],
);
