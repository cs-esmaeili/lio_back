import { Injectable } from '@nestjs/common';

/**
 * A cart line with just enough data to price it. Callers may attach extra
 * fields (product/variant snapshots); `calculate` preserves them untouched.
 */
export interface PricedLine {
  variantId: number;
  quantity: number;
  unitPrice: number;
  /** Reference price before discount. When higher than `unitPrice`, the difference is the line discount. */
  compareAtPrice?: number | null;
}

/** Shipping rule, resolved by the caller (e.g. from the `shipping` site setting). */
export interface PricingShipping {
  enabled: boolean;
  cost: number;
  /** Order subtotal from which shipping is free. `0` (or less) disables the rule. */
  freeOver: number;
}

/**
 * The knobs that turn a cart subtotal into a payable total. Everything is
 * already resolved to concrete values by the caller: this service never looks
 * up a shipping method or validates a coupon code.
 */
export interface PricingPolicy {
  shipping?: PricingShipping;
  /** Already-resolved, unsigned reduction applied to the order (coupon, manual grant, ...). */
  orderDiscount?: number;
}

export interface PricingBreakdown {
  itemCount: number;
  distinctItemCount: number;
  subtotal: number;
  shippingCost: number;
  /** Reduction applied to the order by the policy. */
  orderDiscount: number;
  /**
   * Informational: sum of every line's discount versus its compare-at price
   * (the "you saved" amount). It does not affect `total`, which is already
   * based on the current selling prices.
   */
  totalDiscount: number;
  total: number;
}

export type PricedLineResult<T extends PricedLine> = T & { lineTotal: number; discount: number };

export type PricedResult<T extends PricedLine> = PricingBreakdown & { lines: Array<PricedLineResult<T>> };

/**
 * The single place where money is computed for a cart. The cart endpoints call
 * it with no policy (so they only expose the base breakdown); checkout calls it
 * with a resolved `PricingPolicy` to add shipping and discount. Keeping the math
 * here guarantees both views always agree on every shared number.
 */
@Injectable()
export class CartPricingService {
  calculate<T extends PricedLine>(lines: T[], policy: PricingPolicy = {}): PricedResult<T> {
    const priced = lines.map((line) => {
      const unitDiscount = this.unitDiscount(line);
      return { ...line, lineTotal: line.unitPrice * line.quantity, discount: unitDiscount * line.quantity };
    });

    const subtotal = priced.reduce((sum, line) => sum + line.lineTotal, 0);
    const totalDiscount = priced.reduce((sum, line) => sum + line.discount, 0);
    const shippingCost = this.resolveShippingCost(subtotal, policy.shipping);
    const orderDiscount = this.resolveOrderDiscount(subtotal, policy.orderDiscount);

    return {
      lines: priced,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      distinctItemCount: lines.length,
      subtotal,
      shippingCost,
      orderDiscount,
      totalDiscount,
      total: subtotal + shippingCost - orderDiscount,
    };
  }

  /** Discount of a single unit versus its compare-at price, never negative. */
  private unitDiscount(line: PricedLine): number {
    if (line.compareAtPrice == null || line.compareAtPrice <= line.unitPrice) return 0;
    return line.compareAtPrice - line.unitPrice;
  }

  private resolveShippingCost(subtotal: number, shipping?: PricingShipping): number {
    if (!shipping || !shipping.enabled) return 0;
    if (shipping.freeOver > 0 && subtotal >= shipping.freeOver) return 0;
    return shipping.cost;
  }

  /** Never let an order discount push the total below zero, and ignore negative values. */
  private resolveOrderDiscount(subtotal: number, orderDiscount?: number): number {
    return Math.min(Math.max(orderDiscount ?? 0, 0), subtotal);
  }
}
