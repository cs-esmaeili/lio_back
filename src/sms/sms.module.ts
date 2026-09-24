import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMS_PROVIDER } from './sms.constants';
import { SmsService } from './sms.service';
import { KavenegarProvider } from './providers/kavenegar.provider';
import type { SmsProvider } from './providers/sms-provider.interface';

/**
 * SMS infrastructure. The active provider is selected by `SMS_PROVIDER` and the
 * rest of the app depends only on `SmsService`.
 */
@Module({
  providers: [
    KavenegarProvider,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService, KavenegarProvider],
      useFactory: (config: ConfigService, kavenegar: KavenegarProvider): SmsProvider => {
        const provider = config.get<string>('sms.provider') ?? 'kavenegar';
        switch (provider) {
          case 'kavenegar':
            return kavenegar;
          default:
            throw new Error(`Unsupported SMS provider: ${provider}`);
        }
      },
    },
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
