import { CartPricingService } from './cart-pricing.service';
import type { PricedLine } from './cart-pricing.service';

describe('CartPricingService', () => {
  const pricing = new CartPricingService();

  const line = (variantId: number, quantity: number, unitPrice: number, compareAtPrice: number | null = null): PricedLine => ({
    variantId,
    quantity,
    unitPrice,
    compareAtPrice,
  });

  it('returns an all-zero breakdown for an empty cart', () => {
    const result = pricing.calculate([]);

    expect(result).toEqual({
      lines: [],
      itemCount: 0,
      distinctItemCount: 0,
      subtotal: 0,
      shippingCost: 0,
      orderDiscount: 0,
      totalDiscount: 0,
      total: 0,
    });
  });

  it('computes line totals, counts and subtotal for a single line', () => {
    const result = pricing.calculate([line(1, 11, 123_757)]);

    expect(result.lines).toEqual([{ variantId: 1, quantity: 11, unitPrice: 123_757, compareAtPrice: null, lineTotal: 1_361_327, discount: 0 }]);
    expect(result.itemCount).toBe(11);
    expect(result.distinctItemCount).toBe(1);
    expect(result.subtotal).toBe(1_361_327);
    expect(result.totalDiscount).toBe(0);
    expect(result.total).toBe(1_361_327);
  });

  it('sums quantities separately from distinct lines', () => {
    const result = pricing.calculate([line(1, 2, 100), line(2, 1, 250), line(3, 5, 1_000)]);

    expect(result.itemCount).toBe(8);
    expect(result.distinctItemCount).toBe(3);
    expect(result.subtotal).toBe(5_450);
  });

  it('preserves extra fields attached to a line', () => {
    const [priced] = pricing.calculate([{ ...line(1, 2, 100), productName: 'محصول' }]).lines;

    expect(priced.productName).toBe('محصول');
    expect(priced.lineTotal).toBe(200);
  });

  describe('line discounts (savings versus compare-at price)', () => {
    it('discounts each unit by the compare-at difference times quantity', () => {
      // Was 1000, now 500, bought 2 -> 1000 saved on the line.
      const result = pricing.calculate([line(1, 2, 500, 1_000)]);

      expect(result.lines[0].discount).toBe(1_000);
      expect(result.totalDiscount).toBe(1_000);
    });

    it('is zero when there is no compare-at price, or it is not higher than the price', () => {
      expect(pricing.calculate([line(1, 2, 500)]).lines[0].discount).toBe(0);
      expect(pricing.calculate([line(1, 2, 500, 500)]).lines[0].discount).toBe(0);
      expect(pricing.calculate([line(1, 2, 500, 400)]).lines[0].discount).toBe(0);
    });

    it('sums the discounts of every line into totalDiscount', () => {
      const result = pricing.calculate([line(1, 2, 500, 1_000), line(2, 1, 300, 800), line(3, 3, 100)]);

      expect(result.lines.map((l) => l.discount)).toEqual([1_000, 500, 0]);
      expect(result.totalDiscount).toBe(1_500);
    });

    it('does not change the payable total, which uses the current prices', () => {
      const result = pricing.calculate([line(1, 2, 500, 1_000)]);

      expect(result.subtotal).toBe(1_000);
      expect(result.total).toBe(1_000);
    });
  });

  describe('shipping', () => {
    it('ignores shipping when disabled or absent', () => {
      expect(pricing.calculate([line(1, 1, 100)]).shippingCost).toBe(0);
      expect(pricing.calculate([line(1, 1, 100)], { shipping: { enabled: false, cost: 50, freeOver: 0 } }).shippingCost).toBe(0);
    });

    it('adds shipping to the total when enabled', () => {
      const result = pricing.calculate([line(1, 2, 100)], { shipping: { enabled: true, cost: 50, freeOver: 0 } });

      expect(result.subtotal).toBe(200);
      expect(result.shippingCost).toBe(50);
      expect(result.total).toBe(250);
    });

    it('makes shipping free from the freeOver threshold', () => {
      const policy = { shipping: { enabled: true, cost: 50, freeOver: 200 } };

      expect(pricing.calculate([line(1, 1, 100)], policy).shippingCost).toBe(50);
      expect(pricing.calculate([line(1, 2, 100)], policy).shippingCost).toBe(0);
    });
  });

  describe('order discount', () => {
    it('subtracts the order discount from the total', () => {
      const result = pricing.calculate([line(1, 2, 100)], { orderDiscount: 30 });

      expect(result.subtotal).toBe(200);
      expect(result.orderDiscount).toBe(30);
      expect(result.total).toBe(170);
    });

    it('clamps the order discount to the subtotal and ignores negative values', () => {
      expect(pricing.calculate([line(1, 1, 100)], { orderDiscount: 999 }).total).toBe(0);
      expect(pricing.calculate([line(1, 1, 100)], { orderDiscount: 999 }).orderDiscount).toBe(100);
      expect(pricing.calculate([line(1, 1, 100)], { orderDiscount: -5 }).orderDiscount).toBe(0);
    });

    it('keeps order discount and line savings independent', () => {
      const result = pricing.calculate([line(1, 1, 100, 150)], { orderDiscount: 10 });

      expect(result.subtotal).toBe(100);
      expect(result.totalDiscount).toBe(50);
      expect(result.orderDiscount).toBe(10);
      expect(result.total).toBe(90);
    });
  });

  it('applies shipping and order discount together in order', () => {
    const result = pricing.calculate([line(1, 1, 100)], {
      shipping: { enabled: true, cost: 20, freeOver: 0 },
      orderDiscount: 10,
    });

    expect(result.total).toBe(110);
  });
});
