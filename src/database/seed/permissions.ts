import { permissions } from '../schema';
import type { SeedDb } from './db';

const PERMISSIONS: Array<{ name: string; description: string }> = [
  { name: 'role:read', description: 'List and view roles' },
  { name: 'role:write', description: 'Create, update, and delete roles' },
  { name: 'permission:read', description: 'List permissions' },
  { name: 'permission:write', description: 'Create, update, and delete permissions' },
  { name: 'user:role:manage', description: 'Assign and remove roles on users' },
  { name: 'file:manage', description: 'Manage files and folders' },
  { name: 'site:manage', description: 'Manage site settings (header, footer, etc.)' },
  { name: 'page:manage', description: 'Manage page sections and their content' },
  { name: 'log:read', description: 'View application logs in the log viewer' },
];

export async function seedPermissions(db: SeedDb): Promise<number> {
  for (const permission of PERMISSIONS) {
    await db
      .insert(permissions)
      .values(permission)
      .onConflictDoUpdate({ target: permissions.name, set: { description: permission.description } });
  }

  return db.$count(permissions);
}
