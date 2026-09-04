import { EntityType, type PrismaClient } from '../../src/generated/prisma/client';

export async function seedHomePage(prisma: PrismaClient): Promise<number> {
  await prisma.page.upsert({
    where: { slug: 'home' },
    create: { entityType: EntityType.HOME, slug: 'home' },
    update: { entityType: EntityType.HOME },
  });

  return prisma.page.count({ where: { slug: 'home' } });
}
