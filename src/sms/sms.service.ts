import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMS_PROVIDER, SmsTemplate } from './sms.constants';
import type { SmsProvider, SmsSendResult } from './providers/sms-provider.interface';

/** Iranian mobile number, with or without the leading zero. */
const IRAN_MOBILE_RE = /^0?9\d{9}$/;

/**
 * Provider-agnostic entry point for sending SMS. Resolves logical templates to
 * the configured provider template names and normalizes phone numbers.
 *
 * When SMS is disabled or unconfigured, sends are skipped and logged instead of
 * throwing, so the application keeps running without SMS credentials.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(SMS_PROVIDER) private readonly provider: SmsProvider,
    private readonly config: ConfigService,
  ) {}

  /** Whether SMS is switched on via `SMS_ENABLED`. */
  get enabled(): boolean {
    return this.config.get<boolean>('sms.enabled') ?? false;
  }

  /** Send a login / signup OTP. */
  sendOtp(phone: string, code: string): Promise<SmsSendResult> {
    const receptor = this.normalizePhone(phone);
    return this.dispatch('OTP', () => this.provider.sendOtp(receptor, code));
  }

  /** Send a configured pattern template with named tokens. */
  sendPattern(phone: string, template: SmsTemplate, tokens: Record<string, string>): Promise<SmsSendResult> {
    const receptor = this.normalizePhone(phone);
    const providerTemplate = this.config.getOrThrow<string>(`sms.templates.${template}`);
    return this.dispatch(template, () => this.provider.sendPattern(receptor, providerTemplate, tokens));
  }

  private async dispatch(label: string, send: () => Promise<SmsSendResult>): Promise<SmsSendResult> {
    if (!this.enabled) {
      this.logger.warn(`SMS disabled (SMS_ENABLED=false); skipped ${label}`);
      return { ok: false, error: 'SMS disabled' };
    }

    const result = await send();
    if (!result.ok) {
      this.logger.error(`SMS ${label} failed: ${result.error}`);
    }
    return result;
  }

  private normalizePhone(phone: string): string {
    const value = String(phone ?? '').trim();
    if (!IRAN_MOBILE_RE.test(value)) {
      throw new BadRequestException('Invalid phone number');
    }
    return value.startsWith('0') ? value : `0${value}`;
  }
}
