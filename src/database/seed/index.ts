import 'dotenv/config';
import { createSeedDb } from './db';
import { seedPermissions } from './permissions';
import { seedRole } from './role';
import { seedAdmin } from './admin';
import { seedCategories } from './categories';
import { seedAttributes } from './attributes';
import { seedProducts } from './products';
import { seedHome } from './home';
import { seedHeader } from './header';
import { seedFooter } from './footer';
import { seedSiteSettings } from './site-settings';

const SEEDS = {
  permissions: seedPermissions,
  role: seedRole,
  admin: seedAdmin,
  categories: seedCategories,
  attributes: seedAttributes,
  products: seedProducts,
  home: seedHome,
  header: seedHeader,
  footer: seedFooter,
  siteSettings: seedSiteSettings,
} as const;

type SeedName = keyof typeof SEEDS;

async function main() {
  const { db, close } = createSeedDb();
  const targets = process.argv.slice(2) as SeedName[];

  const unknown = targets.filter((target) => !(target in SEEDS));
  if (unknown.length) {
    throw new Error(`Unknown seed(s): ${unknown.join(', ')}. Available: ${Object.keys(SEEDS).join(', ')}`);
  }

  const seeds: SeedName[] = targets.length ? targets : (Object.keys(SEEDS) as SeedName[]);

  try {
    for (const name of seeds) {
      await SEEDS[name](db);
      console.log(`Seeded: ${name}`);
    }
    console.log('Seed complete.');
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
