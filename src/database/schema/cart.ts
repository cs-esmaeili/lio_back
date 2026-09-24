import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, serial, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { productVariants } from './product-variant';
import { users } from './user';

/**
 * A cart is owned by exactly one identity: a logged-in user (`user_id`) or an
 * anonymous guest (`guest_token`). Keeping both in one table lets the cart
 * items and the merge flow stay identity-agnostic.
 */
export const carts = pgTable(
  'carts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    guestToken: uuid('guest_token'),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('carts_user_id_idx').on(table.userId),
    uniqueIndex('carts_user_id_key')
      .on(table.userId)
      .where(sql`${table.userId} is not null`),
    uniqueIndex('carts_guest_token_key')
      .on(table.guestToken)
      .where(sql`${table.guestToken} is not null`),
    check('carts_owner_check', sql`((${table.userId} is not null)::int + (${table.guestToken} is not null)::int) = 1`),
  ],
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: serial('id').primaryKey(),
    cartId: integer('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    variantId: integer('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').default(1).notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('cart_items_cart_id_variant_id_key').on(table.cartId, table.variantId),
    index('cart_items_cart_id_idx').on(table.cartId),
    index('cart_items_variant_id_idx').on(table.variantId),
  ],
);
