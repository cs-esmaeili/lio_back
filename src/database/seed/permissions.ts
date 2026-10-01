import { permissions } from '../schema';
import type { SeedDb } from './db';
import { ADMIN_PANEL_VIEW_PERMISSION } from '../../authorization/authorization.constants';

const PERMISSIONS: Array<{ name: string; description: string }> = [
  { name: 'role:read', description: 'List and view roles' },
  { name: 'role:write', description: 'Create, update, and delete roles' },
  { name: 'permission:read', description: 'List permissions' },
  { name: 'permission:write', description: 'Create, update, and delete permissions' },
  { name: 'user:role:manage', description: 'Assign and remove roles on users' },
  { name: 'user:read', description: 'View users' },
  { name: 'user:manage', description: 'Update user status' },
  { name: 'file:manage', description: 'Manage files and folders' },
  { name: 'file:read', description: 'View and select files and folders' },
  { name: 'file:upload', description: 'Upload files' },
  { name: 'file:create', description: 'Create folders' },
  { name: 'file:delete', description: 'Delete files and folders' },
  { name: 'site:manage', description: 'Manage site settings (header, footer, etc.)' },
  { name: 'page:manage', description: 'Manage page sections and their content' },
  { name: 'contact:manage', description: 'View and manage contact form messages' },
  { name: 'category:read', description: 'List and view product categories' },
  { name: 'category:manage', description: 'Create, update, and delete product categories' },
  { name: 'product:read', description: 'List and view products' },
  { name: 'product:manage', description: 'Create, update, and delete products and their variants' },
  { name: 'attribute:read', description: 'List and view product attributes and their values' },
  { name: 'attribute:manage', description: 'Create, update, and delete product attributes and their values' },
  { name: 'order:read', description: 'View every order in the admin panel' },
  { name: 'order:manage', description: 'Ship and complete orders' },
  { name: 'log:read', description: 'View application logs in the log viewer' },
  { name: 'location:create', description: 'Create locations' },
  { name: 'location:update', description: 'Update locations' },
  { name: 'location:delete', description: 'Delete locations' },
  { name: ADMIN_PANEL_VIEW_PERMISSION, description: 'View the admin dashboard panel' },
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
