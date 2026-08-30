import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PERMISSIONS: Array<{ name: string; description: string }> = [
  { name: 'role:read', description: 'List and view roles' },
  { name: 'role:write', description: 'Create, update, and delete roles' },
  { name: 'permission:read', description: 'List permissions' },
  { name: 'permission:write', description: 'Create, update, and delete permissions' },
  { name: 'user:role:manage', description: 'Assign and remove roles on users' },
];

async function main() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      create: permission,
      update: { description: permission.description },
    });
  }

  const admin = await prisma.role.upsert({
    where: { name: 'admin' },
    create: { name: 'admin', description: 'Full access' },
    update: {},
  });
  const allPermissions = await prisma.permission.findMany();
  await prisma.rolePermission.deleteMany({ where: { roleId: admin.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((permission) => ({ roleId: admin.id, permissionId: permission.id })),
  });

  const user = await prisma.role.upsert({
    where: { name: 'user' },
    create: { name: 'user', description: 'Default authenticated user' },
    update: {},
  });

  await prisma.user.updateMany({ where: { roleId: null }, data: { roleId: user.id } });

  console.log('Seed complete: roles and permissions created, users backfilled.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
