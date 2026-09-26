import { eq } from 'drizzle-orm';
import { rolePermissions, roles } from '../schema';
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

  await db
    .insert(roles)
    .values(USER_ROLE)
    .onConflictDoUpdate({ target: roles.name, set: { description: USER_ROLE.description } });

  const allPermissions = await db.query.permissions.findMany();
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, adminRole.id));
  if (allPermissions.length) {
    await db.insert(rolePermissions).values(allPermissions.map((permission) => ({ roleId: adminRole.id, permissionId: permission.id })));
  }

  return allPermissions.length;
}
