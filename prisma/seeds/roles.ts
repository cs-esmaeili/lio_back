import type { PrismaClient } from '../../src/generated/prisma/client';

export async function seedAdminRole(prisma: PrismaClient): Promise<number> {
  const admin = await prisma.role.upsert({
    where: { name: 'admin' },
    create: { name: 'admin', description: 'Full access' },
    update: {},
  });

  const permissions = await prisma.permission.findMany();
  await prisma.rolePermission.deleteMany({ where: { roleId: admin.id } });
  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({ roleId: admin.id, permissionId: permission.id })),
  });

  return permissions.length;
}

export async function seedUserRole(prisma: PrismaClient): Promise<void> {
  const user = await prisma.role.upsert({
    where: { name: 'user' },
    create: { name: 'user', description: 'Default authenticated user' },
    update: {},
  });

  await prisma.user.updateMany({ where: { roleId: null }, data: { roleId: user.id } });
}
