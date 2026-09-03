import type { PrismaClient } from '../../src/generated/prisma/client';

const PERMISSIONS: Array<{ name: string; description: string }> = [
  { name: 'role:read', description: 'List and view roles' },
  { name: 'role:write', description: 'Create, update, and delete roles' },
  { name: 'permission:read', description: 'List permissions' },
  { name: 'permission:write', description: 'Create, update, and delete permissions' },
  { name: 'user:role:manage', description: 'Assign and remove roles on users' },
  { name: 'file:manage', description: 'Manage files and folders' },
];

export async function seedPermissions(prisma: PrismaClient): Promise<number> {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      create: permission,
      update: { description: permission.description },
    });
  }

  return prisma.permission.count();
}
