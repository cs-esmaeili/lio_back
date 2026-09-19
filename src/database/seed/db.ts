import 'dotenv/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';

export type SeedDb = NodePgDatabase<typeof schema>;

export function createSeedDb(): { db: SeedDb; close: () => Promise<void> } {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return {
    db: drizzle(pool, { schema }),
    close: () => pool.end(),
  };
}
