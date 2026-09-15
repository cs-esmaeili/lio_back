import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedPermissions } from './seeds/permissions';
import { seedRole } from './seeds/role';
import { seedAdmin } from './seeds/admin';
import { seedCategories } from './seeds/categories';
import { seedAttributes } from './seeds/attributes';
import { seedProducts } from './seeds/products';
import { seedHome } from './seeds/home';
import { seedHeader } from './seeds/header';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SEEDS = {
  permissions: seedPermissions,
  role: seedRole,
  admin: seedAdmin,
  categories: seedCategories,
  attributes: seedAttributes,
  products: seedProducts,
  home: seedHome,
  header: seedHeader,
} as const;

type SeedName = keyof typeof SEEDS;

async function main() {
  const targets = process.argv.slice(2) as SeedName[];

  const unknown = targets.filter((target) => !(target in SEEDS));
  if (unknown.length) {
    throw new Error(`Unknown seed(s): ${unknown.join(', ')}. Available: ${Object.keys(SEEDS).join(', ')}`);
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
