import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SmsProvider, SmsSendResult } from './sms-provider.interface';

interface KavenegarEnvelope {
  return?: { status?: number; message?: string };
  entries?: Array<{ message?: string }>;
}

const DEFAULT_BASE_URL = 'https://api.kavenegar.com';

/**
 * Kavenegar implementation of `SmsProvider` using the Verify Lookup endpoint
 * (https://api.kavenegar.com/v1/{API-KEY}/verify/lookup.json).
 *
 * Uses the global `fetch` available in Node 18+; no extra HTTP dependency.
 */
@Injectable()
export class KavenegarProvider implements SmsProvider {
  private readonly logger = new Logger(KavenegarProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly otpTemplate: string;

  constructor(config: ConfigService) {
    this.apiKey = (config.get<string>('sms.kavenegar.apiKey') ?? '').trim();
    this.baseUrl = (config.get<string>('sms.kavenegar.baseUrl') ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.otpTemplate = config.getOrThrow<string>('sms.templates.otp');
  }

  sendOtp(phone: string, code: string): Promise<SmsSendResult> {
    return this.verifyLookup(phone, this.otpTemplate, { token: code });
  }

  sendPattern(phone: string, template: string, tokens: Record<string, string>): Promise<SmsSendResult> {
    return this.verifyLookup(phone, template, tokens);
  }

  private async verifyLookup(phone: string, template: string, tokens: Record<string, string>): Promise<SmsSendResult> {
    if (!this.apiKey) {
      return { ok: false, error: 'KAVENEGAR_API_KEY is not configured' };
    }

    const params = new URLSearchParams({ receptor: phone, template });
    for (const [key, value] of Object.entries(tokens)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }

    const url = `${this.baseUrl}/v1/${this.apiKey}/verify/lookup.json?${params.toString()}`;

    try {
      const res = await fetch(url, { method: 'GET' });
      const data = (await res.json()) as KavenegarEnvelope;

      if (data.return?.status === 200) {
        return { ok: true };
      }

      const message = data.return?.message ?? data.entries?.[0]?.message ?? 'Unknown Kavenegar error';
      return { ok: false, error: message };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'SMS transport error' };
    }
  }
}
