import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

/** Injection token for the Drizzle database instance. */
export const DATABASE = Symbol('DATABASE');

export type Database = NodePgDatabase<typeof schema>;
