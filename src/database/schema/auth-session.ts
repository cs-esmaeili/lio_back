import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'src/common/utils/uuid';
import { users } from './user';

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    familyId: text('family_id').notNull(),
    expiresAt: timestamp('expires_at', { precision: 3, mode: 'date' }).notNull(),
    revokedAt: timestamp('revoked_at', { precision: 3, mode: 'date' }),
    replacedById: text('replaced_by_id'),
    lastUsedAt: timestamp('last_used_at', { precision: 3, mode: 'date' }),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('auth_sessions_refresh_token_hash_key').on(table.refreshTokenHash),
    index('auth_sessions_user_id_idx').on(table.userId),
    index('auth_sessions_family_id_idx').on(table.familyId),
  ],
);
