import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { userStatus } from './enums';
import { roles } from './role';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: text('username').notNull(),
    nationalCode: text('national_code'),
    name: text('name'),
    lastName: text('last_name'),
    passwordHash: text('password_hash'),
    status: userStatus('status').default('ACTIVE').notNull(),
    roleId: integer('role_id').references(() => roles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('users_username_key').on(table.username), uniqueIndex('users_national_code_key').on(table.nationalCode), index('users_role_id_idx').on(table.roleId)],
);
