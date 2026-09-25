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
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { precision: 3, mode: 'date' }).notNull(),
    revokedAt: timestamp('revoked_at', { precision: 3, mode: 'date' }),
    lastUsedAt: timestamp('last_used_at', { precision: 3, mode: 'date' }),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('auth_sessions_token_hash_key').on(table.tokenHash), index('auth_sessions_user_id_idx').on(table.userId)],
);
