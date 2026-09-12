import type { PrismaClient } from '../../src/generated/prisma/client';

const ADMIN_ROLE = { name: 'admin', description: 'Full access' };

export async function seedRole(prisma: PrismaClient): Promise<number> {
  const role = await prisma.role.upsert({
    where: { name: ADMIN_ROLE.name },
    create: ADMIN_ROLE,
    update: { description: ADMIN_ROLE.description },
  });

  const permissions = await prisma.permission.findMany();
  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
  });

  return permissions.length;
}
