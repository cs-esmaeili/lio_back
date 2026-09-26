import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_PROVIDER } from './payment.constants';
import { PaymentService } from './payment.service';
import { ZarinpalProvider } from './providers/zarinpal.provider';
import type { PaymentProvider } from './providers/payment-provider.interface';

/**
 * Payment infrastructure. The active provider is selected by `PAYMENT_PROVIDER`
 * and the rest of the app depends only on `PaymentService`.
 */
@Module({
  providers: [
    ZarinpalProvider,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, ZarinpalProvider],
      useFactory: (config: ConfigService, zarinpal: ZarinpalProvider): PaymentProvider => {
        const provider = config.get<string>('payment.provider') ?? 'zarinpal';
        switch (provider) {
          case 'zarinpal':
            return zarinpal;
          default:
            throw new Error(`Unsupported payment provider: ${provider}`);
        }
      },
    },
    PaymentService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
