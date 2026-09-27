import { eq, isNull } from 'drizzle-orm';
import { rolePermissions, roles, users } from '../schema';
import type { SeedDb } from './db';
import { DEFAULT_USER_ROLE_NAME } from '../../authorization/authorization.constants';

const ADMIN_ROLE = { name: 'admin', description: 'Full access' };
const USER_ROLE = { name: DEFAULT_USER_ROLE_NAME, description: 'Default role for registered users' };

export async function seedRole(db: SeedDb): Promise<number> {
  const [adminRole] = await db
    .insert(roles)
    .values(ADMIN_ROLE)
    .onConflictDoUpdate({ target: roles.name, set: { description: ADMIN_ROLE.description } })
    .returning();

  const [userRole] = await db
    .insert(roles)
    .values(USER_ROLE)
    .onConflictDoUpdate({ target: roles.name, set: { description: USER_ROLE.description } })
    .returning();

  // Every user must have a role: backfill legacy users created before the role became mandatory.
  await db.update(users).set({ roleId: userRole.id }).where(isNull(users.roleId));

  const allPermissions = await db.query.permissions.findMany();
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, adminRole.id));
  if (allPermissions.length) {
    await db.insert(rolePermissions).values(allPermissions.map((permission) => ({ roleId: adminRole.id, permissionId: permission.id })));
  }

  return allPermissions.length;
}
