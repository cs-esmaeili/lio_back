import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckoutPaymentRepository } from '../repositories/checkout-payment.repository';

/**
 * Releases stock held by unpaid orders.
 *
 * An order reserves inventory the moment the payer starts the gateway, and
 * `orders.expiresAt` (set from `PAYMENT_ORDER_TTL_MINUTES`) bounds that
 * reservation. Every five minutes this sweeps the orders that ran past their
 * deadline, moves them to `EXPIRED`, and returns their units to stock.
 */
@Injectable()
export class OrderExpiryService {
  private readonly logger = new Logger(OrderExpiryService.name);

  constructor(private readonly repository: CheckoutPaymentRepository) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'order-expiry' })
  async expireUnpaidOrders(): Promise<void> {
    const expired = await this.repository.expireStaleOrders(new Date());
    if (expired > 0) {
      this.logger.log(`Expired ${expired} unpaid order(s) and released their reserved stock`);
    }
  }
}
