import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { otpPurpose } from './enums';

export const otps = pgTable(
  'otps',
  {
    id: serial('id').primaryKey(),
    phone: text('phone').notNull(),
    codeHash: text('code_hash').notNull(),
    purpose: otpPurpose('purpose').default('LOGIN').notNull(),
    expiresAt: timestamp('expires_at', { precision: 3, mode: 'date' }).notNull(),
    usedAt: timestamp('used_at', { precision: 3, mode: 'date' }),
    attempts: integer('attempts').default(0).notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [index('otps_phone_created_at_idx').on(table.phone, table.createdAt), index('otps_phone_purpose_idx').on(table.phone, table.purpose)],
);
