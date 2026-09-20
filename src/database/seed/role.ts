import { eq } from 'drizzle-orm';
import { rolePermissions, roles } from '../schema';
import type { SeedDb } from './db';

const ADMIN_ROLE = { name: 'admin', description: 'Full access' };

export async function seedRole(db: SeedDb): Promise<number> {
  const [role] = await db
    .insert(roles)
    .values(ADMIN_ROLE)
    .onConflictDoUpdate({ target: roles.name, set: { description: ADMIN_ROLE.description } })
    .returning();

  const allPermissions = await db.query.permissions.findMany();
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
  if (allPermissions.length) {
    await db.insert(rolePermissions).values(allPermissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })));
  }

  return allPermissions.length;
}
