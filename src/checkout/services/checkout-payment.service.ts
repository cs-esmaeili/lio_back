import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { OrderStatus, PaymentStatus } from 'src/database/schema';
import { PaymentService } from 'src/payment/payment.service';
import type { CreatePaymentRequestDto } from '../dtos/createPayment/create-payment-request.dto';
import type { CreatePaymentResponseDto } from '../dtos/createPayment/create-payment-response.dto';
import { CheckoutPaymentRepository } from '../repositories/checkout-payment.repository';
import { CheckoutService } from './checkout.service';

/** Outcome of a gateway callback, later serialized into the frontend result URL. */
interface PaymentCallbackResult {
  status: 'success' | 'failed';
  orderId?: number;
  orderNumber?: string;
  refId?: string | null;
  reason?: string;
}

/**
 * Turns the cart into an order and starts its gateway payment, then finalizes
 * the payment when the gateway redirects the payer back. It reuses
 * {@link CheckoutService} for cart pricing and the shipping rule, so the amount
 * charged can never drift from the amount shown on the checkout page.
 */
@Injectable()
export class CheckoutPaymentService {
  private readonly callbackUrl: string;
  private readonly frontendResultUrl: string;
  private readonly orderTtlMinutes: number;

  constructor(
    private readonly checkout: CheckoutService,
    private readonly payment: PaymentService,
    private readonly repository: CheckoutPaymentRepository,
    config: ConfigService,
  ) {
    this.callbackUrl = config.getOrThrow<string>('payment.callbackUrl');
    this.frontendResultUrl = config.getOrThrow<string>('payment.frontendResultUrl');
    this.orderTtlMinutes = config.getOrThrow<number>('payment.orderTtlMinutes');
  }

  /**
   * Create the order (reserving stock) and open a gateway session. When the
   * gateway rejects the request the order is canceled and its stock released,
   * so a failed start never leaves inventory held.
   */
  async createPayment(userId: number, dto: CreatePaymentRequestDto): Promise<CreatePaymentResponseDto> {
    const checkout = await this.checkout.getCheckout(userId);
    if (checkout.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const address = checkout.addresses.find((item) => item.id === dto.addressId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const provider = this.payment.providerName;
    const orderNumber = this.generateOrderNumber();
    const expiresAt = new Date(Date.now() + this.orderTtlMinutes * 60_000);

    const created = await this.repository.createOrder({
      orderNumber,
      userId,
      provider,
      amount: checkout.total,
      subtotal: checkout.subtotal,
      discount: checkout.orderDiscount,
      shippingCost: checkout.shippingCost,
      total: checkout.total,
      firstName: checkout.customer.name ?? '',
      lastName: checkout.customer.lastName ?? '',
      phone: checkout.customer.phone,
      company: null,
      province: address.location.province,
      city: address.location.city,
      address: address.address,
      postalCode: address.postalCode,
      expiresAt,
      items: checkout.items.map((item) => ({
        variantId: item.variantId,
        productId: item.product.id,
        productName: item.product.name,
        productSlug: item.product.slug,
        sku: item.variant.sku,
        unitPrice: item.variant.price,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    });

    const request = await this.payment.request({
      orderId: created.orderId,
      amount: checkout.total,
      description: `سفارش ${created.orderNumber}`,
      callbackUrl: this.callbackUrl,
      mobile: checkout.customer.phone,
    });

    if (!request.ok || !request.authority || !request.paymentUrl) {
      await this.repository.cancelOrder({
        orderId: created.orderId,
        paymentId: created.paymentId,
        paymentStatus: PaymentStatus.FAILED,
        verifyPayload: toJsonPayload(request.raw),
      });
      throw new BadGatewayException(request.error ?? 'Payment gateway rejected the request');
    }

    await this.repository.setPaymentRequest(created.paymentId, request.authority, toJsonPayload(request.raw));

    return {
      orderId: created.orderId,
      orderNumber: created.orderNumber,
      amount: checkout.total,
      provider,
      paymentUrl: request.paymentUrl,
    };
  }

  /**
   * Verify a payment after the gateway redirects the payer back, update the
   * order/payment, and return the frontend result URL. Every branch (missing
   * authority, user cancellation, gateway failure) ends in a redirect, so the
   * caller can always send the payer to a result page.
   */
  async handleCallback(authority: string | undefined, status: string | undefined): Promise<string> {
    if (!authority) {
      return this.buildResultUrl({ status: 'failed', reason: 'missing_authority' });
    }

    const payment = await this.repository.findByAuthority(authority);
    if (!payment) {
      return this.buildResultUrl({ status: 'failed', reason: 'not_found' });
    }

    const base = { orderId: payment.orderId, orderNumber: payment.orderNumber };

    // Idempotent: a repeated callback for an already-verified payment succeeds.
    if (payment.paymentStatus === PaymentStatus.VERIFIED || payment.orderStatus === OrderStatus.PAID) {
      return this.buildResultUrl({ status: 'success', ...base, refId: payment.refId });
    }

    // The payer canceled (or the gateway refused) before we ever verify.
    if ((status ?? '').toUpperCase() !== 'OK') {
      await this.repository.cancelOrder({
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        paymentStatus: PaymentStatus.CANCELED,
        verifyPayload: null,
      });
      return this.buildResultUrl({ status: 'failed', ...base, reason: 'canceled' });
    }

    const verified = await this.payment.verify({ authority, amount: Number(payment.amount) });
    if (!verified.ok) {
      await this.repository.cancelOrder({
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        paymentStatus: PaymentStatus.FAILED,
        verifyPayload: toJsonPayload(verified.raw),
      });
      return this.buildResultUrl({ status: 'failed', ...base, reason: 'verify_failed' });
    }

    const paid = await this.repository.markOrderPaid({
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      refId: verified.refId ?? null,
      verifyPayload: toJsonPayload(verified.raw),
    });
    if (!paid) {
      // Lost a race with a concurrent callback: succeed only if it paid the order.
      const current = await this.repository.findByAuthority(authority);
      if (current?.orderStatus === OrderStatus.PAID) {
        return this.buildResultUrl({ status: 'success', ...base, refId: current.refId });
      }
      return this.buildResultUrl({ status: 'failed', ...base, reason: 'not_payable' });
    }

    return this.buildResultUrl({ status: 'success', ...base, refId: verified.refId ?? null });
  }

  private buildResultUrl(result: PaymentCallbackResult): string {
    const url = new URL(this.frontendResultUrl);
    url.searchParams.set('status', result.status);
    if (result.orderId !== undefined) url.searchParams.set('orderId', String(result.orderId));
    if (result.orderNumber) url.searchParams.set('orderNumber', result.orderNumber);
    if (result.refId) url.searchParams.set('refId', result.refId);
    if (result.reason) url.searchParams.set('reason', result.reason);
    return url.toString();
  }

  /** A collision-resistant, human-readable order number (date + random suffix). */
  private generateOrderNumber(): string {
    const now = new Date();
    const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const random = randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
    return `ORD-${date}-${random}`;
  }
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Store the raw gateway payload as jsonb; scalars are wrapped so nothing is lost. */
function toJsonPayload(raw: unknown): Record<string, unknown> | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  return { value: raw };
}
