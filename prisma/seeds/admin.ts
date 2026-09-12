import type { PrismaClient } from '../../src/generated/prisma/client';

const ADMIN_PHONE = '09123456789';

export async function seedAdmin(prisma: PrismaClient): Promise<number> {
  const role = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!role) {
    throw new Error('Admin role not found. Run the "role" seed first.');
  }

  const user = await prisma.user.upsert({
    where: { username: ADMIN_PHONE },
    create: { username: ADMIN_PHONE, name: 'Admin', roleId: role.id },
    update: { roleId: role.id },
  });

  return user.id;
}
