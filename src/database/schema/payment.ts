import { sql } from 'drizzle-orm';
import { index, integer, jsonb, numeric, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { paymentStatus } from './enums';
import { orders } from './order';

/**
 * A gateway transaction attempt, kept separate from the order so every request
 * and verify is auditable. One order can accumulate several rows (retries); the
 * authority is what the gateway redirects back with.
 */
export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    // Null until the gateway answers the request.
    authority: text('authority'),
    status: paymentStatus('status').default('INITIATED').notNull(),
    refId: text('ref_id'),
    requestPayload: jsonb('request_payload').$type<Record<string, unknown>>(),
    verifyPayload: jsonb('verify_payload').$type<Record<string, unknown>>(),
    verifiedAt: timestamp('verified_at', { precision: 3, mode: 'date' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('payments_order_id_idx').on(table.orderId),
    uniqueIndex('payments_authority_key')
      .on(table.authority)
      .where(sql`${table.authority} is not null`),
    index('payments_status_idx').on(table.status),
  ],
);
