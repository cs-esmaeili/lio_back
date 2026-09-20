import { index, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { permissions } from './permission';
import { roles } from './role';

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId], name: 'role_permissions_pkey' }), index('role_permissions_permission_id_idx').on(table.permissionId)],
);
