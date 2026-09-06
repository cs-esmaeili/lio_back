import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedPermissions } from './seeds/permissions';
import { seedAdminRole, seedUserRole } from './seeds/roles';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SEEDS = {
  permissions: seedPermissions,
  'admin-role': seedAdminRole,
  'user-role': seedUserRole,
} as const;

type SeedName = keyof typeof SEEDS;

async function main() {
  const targets = process.argv.slice(2) as SeedName[];

  const unknown = targets.filter((target) => !(target in SEEDS));
  if (unknown.length) {
    throw new Error(
      `Unknown seed(s): ${unknown.join(', ')}. Available: ${Object.keys(SEEDS).join(', ')}`,
    );
  }

  const seeds: SeedName[] = targets.length ? targets : (Object.keys(SEEDS) as SeedName[]);

  for (const name of seeds) {
    await SEEDS[name](prisma);
    console.log(`Seeded: ${name}`);
  }

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
