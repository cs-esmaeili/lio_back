import { locations } from '../schema';
import type { SeedDb } from './db';
import { IRAN_PROVINCES } from './data/iran-locations';

/**
 * Seeds the flat `locations` (province/city) table from the Iranian dataset.
 * Idempotent: only pairs not already present are inserted, so existing rows
 * (and any addresses referencing them) are preserved.
 */
export async function seedLocation(db: SeedDb): Promise<number> {
  const existing = await db.query.locations.findMany({ columns: { province: true, city: true } });
  const seen = new Set(existing.map((row) => `${row.province}\u0000${row.city}`));

  const missing = IRAN_PROVINCES.flatMap(({ province, cities }) => cities.filter((city) => !seen.has(`${province}\u0000${city}`)).map((city) => ({ province, city })));

  if (missing.length) {
    await db.insert(locations).values(missing);
  }

  return db.$count(locations);
}
