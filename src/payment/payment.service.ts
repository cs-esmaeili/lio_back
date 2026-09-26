import { Inject, Injectable, Logger } from '@nestjs/common';
import { PAYMENT_PROVIDER } from './payment.constants';
import type { PaymentProvider, PaymentRequestInput, PaymentRequestResult, PaymentVerifyInput, PaymentVerifyResult } from './providers/payment-provider.interface';

/**
 * Provider-agnostic entry point for payments. The rest of the application only
 * depends on this service, never on a concrete gateway.
 *
 * Failures are returned as results (never thrown) so callers keep control over
 * the order state and can compensate explicitly.
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(@Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  /** Name of the active gateway, used for logging and persistence. */
  get providerName(): string {
    return this.provider.name;
  }

  /** Open a payment session and return the authority plus the redirect URL. */
  async request(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const result = await this.provider.request(input);
    if (!result.ok) {
      this.logger.error(`Payment request via ${this.provider.name} failed: ${result.error}`);
    }
    return result;
  }

  /** Verify a payment after the gateway redirects the payer back. Idempotent. */
  async verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    const result = await this.provider.verify(input);
    if (!result.ok) {
      this.logger.error(`Payment verify via ${this.provider.name} failed: ${result.error}`);
    }
    return result;
  }

  /** Build the URL the payer is redirected to in order to pay. */
  startPayUrl(authority: string): string {
    return this.provider.startPayUrl(authority);
  }
}
