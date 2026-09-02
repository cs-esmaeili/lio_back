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
  { name: 'file:manage', description: 'Manage files and folders' },
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

  const permissions = await prisma.permission.findMany();
  await prisma.rolePermission.deleteMany({ where: { roleId: admin.id } });
  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({ roleId: admin.id, permissionId: permission.id })),
  });

  console.log(`Granted ${permissions.length} permissions to admin role.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
