import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, sql } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { cartItems, carts, OrderStatus, orderItems, orders, PaymentStatus, payments, productVariants } from 'src/database/schema';

export interface CreateOrderItemInput {
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CreateOrderInput {
  orderNumber: string;
  userId: number;
  provider: string;
  amount: number;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  firstName: string;
  lastName: string;
  phone: string;
  company: string | null;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  expiresAt: Date;
  items: CreateOrderItemInput[];
}

export interface CreateOrderResult {
  orderId: number;
  orderNumber: string;
  paymentId: number;
}

/** Payment joined to its order, enough to drive the gateway callback. */
export interface PaymentOrderRow {
  paymentId: number;
  orderId: number;
  amount: string;
  provider: string;
  paymentStatus: PaymentStatus;
  refId: string | null;
  orderNumber: string;
  orderStatus: OrderStatus;
  userId: number | null;
}

/**
 * Persistence for the checkout payment flow: the order snapshot, its line items
 * and the gateway attempt are written together, and the stock reservation is
 * released or committed together with the order status. Keeping these
 * transitions in one place means a callback can never move money without moving
 * the order, or vice versa.
 */
@Injectable()
export class CheckoutPaymentRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Create the order, its items and the payment attempt in one transaction.
   *
   * Stock is reserved here (when the payer presses pay), never in the cart. The
   * reservation is concurrency-safe:
   *   1. lines are sorted by variant id, so every transaction takes row locks in
   *      the same order (two orders sharing variants can never deadlock);
   *   2. each variant row is locked explicitly with `SELECT ... FOR UPDATE`;
   *   3. the decrement is guarded by `stock >= quantity`, so if the lock showed
   *      the stock is now short the transaction aborts instead of over-selling.
   * Two buyers can therefore never take the same last unit.
   */
  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    return this.db.transaction(async (tx) => {
      // Consistent, ascending lock order across every transaction.
      const items = [...input.items].sort((a, b) => a.variantId - b.variantId);

      for (const item of items) {
        const locked = await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.id, item.variantId)).for('update');
        if (locked.length === 0) {
          throw new BadRequestException(`Variant not found for ${item.sku}`);
        }

        const reserved = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
          .where(and(eq(productVariants.id, item.variantId), gte(productVariants.stock, item.quantity)))
          .returning({ id: productVariants.id });
        if (reserved.length === 0) {
          throw new BadRequestException(`Not enough stock for ${item.sku}`);
        }
      }

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: input.orderNumber,
          userId: input.userId,
          subtotal: String(input.subtotal),
          discount: String(input.discount),
          shippingCost: String(input.shippingCost),
          total: String(input.total),
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          company: input.company,
          province: input.province,
          city: input.city,
          address: input.address,
          postalCode: input.postalCode,
          expiresAt: input.expiresAt,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      await tx.insert(orderItems).values(
        input.items.map((item) => ({
          orderId: order.id,
          variantId: item.variantId,
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          sku: item.sku,
          unitPrice: String(item.unitPrice),
          quantity: item.quantity,
          lineTotal: String(item.lineTotal),
        })),
      );

      const [payment] = await tx
        .insert(payments)
        .values({ orderId: order.id, provider: input.provider, amount: String(input.amount) })
        .returning({ id: payments.id });

      return { orderId: order.id, orderNumber: order.orderNumber, paymentId: payment.id };
    });
  }

  /** Attach the gateway authority and request payload once the gateway answers. */
  async setPaymentRequest(paymentId: number, authority: string, requestPayload: Record<string, unknown> | null): Promise<void> {
    await this.db.update(payments).set({ authority, requestPayload }).where(eq(payments.id, paymentId));
  }

  findByAuthority(authority: string): Promise<PaymentOrderRow | undefined> {
    return this.db
      .select({
        paymentId: payments.id,
        orderId: payments.orderId,
        amount: payments.amount,
        provider: payments.provider,
        paymentStatus: payments.status,
        refId: payments.refId,
        orderNumber: orders.orderNumber,
        orderStatus: orders.status,
        userId: orders.userId,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(payments.authority, authority))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Mark the order paid and the payment verified. Claims the order with a
   * guarded `PENDING_PAYMENT -> PAID` update so concurrent callbacks cannot pay
   * twice; returns `false` when the order was already moved out of pending.
   * The now-purchased cart is cleared in the same transaction.
   */
  markOrderPaid(input: { orderId: number; paymentId: number; refId: string | null; verifyPayload: Record<string, unknown> | null }): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const claimed = await tx
        .update(orders)
        .set({ status: OrderStatus.PAID, paidAt: new Date() })
        .where(and(eq(orders.id, input.orderId), eq(orders.status, OrderStatus.PENDING_PAYMENT)))
        .returning({ id: orders.id, userId: orders.userId });
      if (claimed.length === 0) return false;

      await tx
        .update(payments)
        .set({ status: PaymentStatus.VERIFIED, refId: input.refId, verifyPayload: input.verifyPayload, verifiedAt: new Date() })
        .where(eq(payments.id, input.paymentId));

      const userId = claimed[0].userId;
      if (userId !== null) {
        const cart = await tx.query.carts.findFirst({ where: eq(carts.userId, userId), columns: { id: true } });
        if (cart) {
          await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
        }
      }

      return true;
    });
  }

  /**
   * Cancel the order and release every reserved unit back to stock. Claims the
   * order with a guarded `PENDING_PAYMENT -> CANCELED` update first, so a second
   * callback (or an expired-order sweeper) can never release the same units
   * twice. Returns `false` when the order was already moved out of pending.
   *
   * Variants are locked in the same ascending id order as {@link createOrder},
   * so a reserve and a release running at the same time cannot deadlock.
   */
  cancelOrder(input: { orderId: number; paymentId: number; paymentStatus: PaymentStatus; verifyPayload: Record<string, unknown> | null }): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const claimed = await tx
        .update(orders)
        .set({ status: OrderStatus.CANCELED, canceledAt: new Date() })
        .where(and(eq(orders.id, input.orderId), eq(orders.status, OrderStatus.PENDING_PAYMENT)))
        .returning({ id: orders.id });
      if (claimed.length === 0) return false;

      const items = await tx.select({ variantId: orderItems.variantId, quantity: orderItems.quantity }).from(orderItems).where(eq(orderItems.orderId, input.orderId));

      const release = items.filter((item): item is { variantId: number; quantity: number } => item.variantId !== null).sort((a, b) => a.variantId - b.variantId);

      for (const item of release) {
        await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.id, item.variantId)).for('update');
        await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
          .where(eq(productVariants.id, item.variantId));
      }

      await tx.update(payments).set({ status: input.paymentStatus, verifyPayload: input.verifyPayload }).where(eq(payments.id, input.paymentId));

      return true;
    });
  }
}
