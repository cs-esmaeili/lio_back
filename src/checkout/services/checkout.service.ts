import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CartService } from 'src/cart/services/cart.service';
import { CartPricingService } from 'src/cart/services/cart-pricing.service';
import type { PricingShipping } from 'src/cart/services/cart-pricing.service';
import { SiteSettingService } from 'src/site-setting/services/site-setting.service';
import { AddressRepository } from 'src/address/repositories/address.repository';
import { UsersService } from 'src/users/users.service';
import { PaymentService } from 'src/payment/payment.service';
import type { GetCheckoutResponseDto } from '../dtos/getCheckout/get-checkout-response.dto';

/** Key of the site setting that carries the shipping rule. */
const SHIPPING_SETTING_KEY = 'shipping';

/**
 * Assembles the single payload the checkout page renders. It reuses the cart
 * projection (`CartService`) and the one money-math service
 * (`CartPricingService`), only adding the checkout-only inputs (shipping rule,
 * customer, addresses, payment gateway) resolved server-side.
 */
@Injectable()
export class CheckoutService {
  constructor(
    private readonly cart: CartService,
    private readonly pricing: CartPricingService,
    private readonly siteSettings: SiteSettingService,
    private readonly address: AddressRepository,
    private readonly users: UsersService,
    private readonly payment: PaymentService,
  ) {}

  async getCheckout(userId: number): Promise<GetCheckoutResponseDto> {
    const cart = await this.cart.getCart({ userId, guestToken: null });
    const shipping = await this.resolveShipping();

    // Price through the shared service so the checkout numbers can never drift
    // from the cart ones: it recomputes the line totals and adds shipping.
    // An empty cart has nothing to ship, so shipping is only applied once there
    // is at least one line (otherwise `total` would just be the shipping fee).
    const lines = cart.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.variant.price,
      compareAtPrice: item.variant.compareAtPrice,
      product: item.product,
      variant: item.variant,
    }));
    const priced = this.pricing.calculate(lines, lines.length > 0 ? { shipping: shipping.policy } : {});

    const [user, addressRows] = await Promise.all([this.users.findById(userId), this.address.listByUser(userId)]);
    if (!user) throw new UnauthorizedException();

    // Decoupled from the address endpoint DTO: checkout owns its own address
    // shape and reads it straight from the shared repository projection.
    const addresses = addressRows.map((row) => ({
      id: row.id,
      title: row.title,
      address: row.address,
      postalCode: row.postalCode,
      isMain: row.isMain,
      locationId: row.locationId,
      location: { id: row.location.id, province: row.location.province, city: row.location.city },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    return {
      items: priced.lines.map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
        discount: line.discount,
        product: line.product,
        variant: line.variant,
      })),
      itemCount: priced.itemCount,
      distinctItemCount: priced.distinctItemCount,
      subtotal: priced.subtotal,
      shippingCost: priced.shippingCost,
      orderDiscount: priced.orderDiscount,
      totalDiscount: priced.totalDiscount,
      total: priced.total,
      shipping: shipping.dto,
      customer: { id: user.id, phone: user.username, name: user.name, lastName: user.lastName },
      addresses,
      defaultAddressId: addresses.find((address) => address.isMain)?.id ?? null,
      payment: { provider: this.payment.providerName },
    };
  }

  /**
   * Resolve the shipping rule from the `shipping` site setting. A missing or
   * malformed setting degrades to "no shipping" instead of failing checkout.
   */
  private async resolveShipping(): Promise<{ policy: PricingShipping; dto: GetCheckoutResponseDto['shipping'] }> {
    const setting = await this.siteSettings.findByKey(SHIPPING_SETTING_KEY);
    const data = setting?.data ?? {};
    const enabled = data.enabled === true;
    const cost = toNonNegativeNumber(data.cost);
    const freeOver = toNonNegativeNumber(data.freeOver);
    return { policy: { enabled, cost, freeOver }, dto: { enabled, cost, freeOver } };
  }
}

function toNonNegativeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}
