import { sql } from 'drizzle-orm';
import { check, index, integer, numeric, pgTable, serial, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { orderStatus } from './enums';
import { products } from './product';
import { productVariants } from './product-variant';
import { users } from './user';

/**
 * An order is created atomically when the customer commits to buy: stock is
 * reserved (decremented) inside the same transaction. The cart owns nothing at
 * this level; every price and address is copied here so later edits to the
 * product or the customer's profile never rewrite an issued order.
 */
export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    orderNumber: text('order_number').notNull(),
    // Owner: a logged-in user, an anonymous guest, or (after a user is deleted)
    // neither. Financial records are never cascade-deleted with a user.
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    guestToken: uuid('guest_token'),
    status: orderStatus('status').default('PENDING_PAYMENT').notNull(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    discount: numeric('discount', { precision: 12, scale: 2 }).default('0').notNull(),
    shippingCost: numeric('shipping_cost', { precision: 12, scale: 2 }).default('0').notNull(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    // Customer snapshot.
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone').notNull(),
    company: text('company'),
    // Shipping address snapshot.
    province: text('province').notNull(),
    city: text('city').notNull(),
    address: text('address').notNull(),
    postalCode: text('postal_code').notNull(),
    paidAt: timestamp('paid_at', { precision: 3, mode: 'date' }),
    canceledAt: timestamp('canceled_at', { precision: 3, mode: 'date' }),
    // Reserved stock is released once this moment passes and the order is still unpaid.
    expiresAt: timestamp('expires_at', { precision: 3, mode: 'date' }).notNull(),
    paidSmsSentAt: timestamp('paid_sms_sent_at', { precision: 3, mode: 'date' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('orders_order_number_key').on(table.orderNumber),
    index('orders_user_id_idx').on(table.userId),
    uniqueIndex('orders_guest_token_key')
      .on(table.guestToken)
      .where(sql`${table.guestToken} is not null`),
    index('orders_status_idx').on(table.status),
    index('orders_expires_at_idx').on(table.expiresAt),
    check('orders_owner_check', sql`((${table.userId} is not null)::int + (${table.guestToken} is not null)::int) <= 1`),
  ],
);

/**
 * A purchased line, copied from the cart at order time. `variantId`/`productId`
 * are kept only as a trace; the name, sku and prices are the source of truth for
 * the issued order and are never re-read from the catalog.
 */
export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    variantId: integer('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
    productName: text('product_name').notNull(),
    productSlug: text('product_slug').notNull(),
    sku: text('sku').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [index('order_items_order_id_idx').on(table.orderId), index('order_items_variant_id_idx').on(table.variantId)],
);
