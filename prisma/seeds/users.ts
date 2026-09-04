import { hash } from '@node-rs/argon2';
import { UserStatus, type PrismaClient } from '../../src/generated/prisma/client';
import { seedAdminRole } from './roles';

export async function seedTestUser(prisma: PrismaClient): Promise<number> {
  await seedAdminRole(prisma);

  const admin = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });

  const passwordHash = await hash('12345678', {
    algorithm: 2, // Argon2id
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const user = await prisma.user.upsert({
    where: { username: '09137378601' },
    create: {
      username: '09137378601',
      name: 'Test Admin',
      passwordHash,
      roleId: admin.id,
      status: UserStatus.ACTIVE,
    },
    update: {
      passwordHash,
      roleId: admin.id,
      status: UserStatus.ACTIVE,
    },
  });

  return user.id;
}
