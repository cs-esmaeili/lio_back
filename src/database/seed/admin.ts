import { eq } from 'drizzle-orm';
import { roles, users } from '../schema';
import type { SeedDb } from './db';

const ADMIN_PHONE = '09123456789';

export async function seedAdmin(db: SeedDb): Promise<number> {
  const role = await db.query.roles.findFirst({ where: eq(roles.name, 'admin') });
  if (!role) {
    throw new Error('Admin role not found. Run the "role" seed first.');
  }

  const [user] = await db
    .insert(users)
    .values({ username: ADMIN_PHONE, name: 'Admin', roleId: role.id })
    .onConflictDoUpdate({ target: users.username, set: { roleId: role.id } })
    .returning();

  return user.id;
}
