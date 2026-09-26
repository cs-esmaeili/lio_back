import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PaymentProvider, PaymentRequestInput, PaymentRequestResult, PaymentVerifyInput, PaymentVerifyResult } from './payment-provider.interface';

interface ZarinpalRequestData {
  code?: number;
  authority?: string;
  fee?: number;
  message?: string;
}

interface ZarinpalVerifyData {
  code?: number;
  ref_id?: number | string;
  card_pan?: string;
  message?: string;
}

interface ZarinpalEnvelope<T> {
  data?: T;
  errors?: unknown;
}

/** Zarinpal v4 success code for a request/verify. */
const ZARINPAL_SUCCESS = 100;
/** Zarinpal returns 101 when an authority has already been verified; treat it as success (idempotent verify). */
const ZARINPAL_ALREADY_VERIFIED = 101;

const PRODUCTION_API_BASE = 'https://api.zarinpal.com/pg/v4/payment';
const PRODUCTION_START_PAY_BASE = 'https://www.zarinpal.com/pg/StartPay';
const SANDBOX_API_BASE = 'https://sandbox.zarinpal.com/pg/v4/payment';
const SANDBOX_START_PAY_BASE = 'https://sandbox.zarinpal.com/pg/StartPay';

/** Extract a human-readable message from Zarinpal's `errors` field. */
const describeErrors = (errors: unknown): string | undefined => {
  if (!errors) {
    return undefined;
  }
  if (typeof errors === 'string') {
    return errors;
  }
  if (Array.isArray(errors)) {
    const first = errors[0] as { message?: unknown } | undefined;
    return typeof first?.message === 'string' ? first.message : 'Zarinpal error';
  }
  if (typeof errors === 'object') {
    const message = (errors as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return undefined;
};

/** Prefer the provider-provided message, then `errors`, then the fallback. */
const describeError = (message: string | undefined, errors: unknown, fallback: string): string => message ?? describeErrors(errors) ?? fallback;

/**
 * Zarinpal implementation of `PaymentProvider` using the v4 payment API
 * (https://api.zarinpal.com/pg/v4/payment). Uses the global `fetch` available
 * in Node 18+; no extra HTTP dependency.
 *
 * The store prices are in Toman while Zarinpal expects Rial, so every amount is
 * multiplied by 10 (and clamped to Zarinpal's 1000 Rial minimum).
 */
@Injectable()
export class ZarinpalProvider implements PaymentProvider {
  readonly name = 'zarinpal';

  private readonly merchantId: string;
  private readonly apiBase: string;
  private readonly startPayBase: string;

  constructor(config: ConfigService) {
    const sandbox = config.get<boolean>('payment.zarinpal.sandbox') ?? false;
    this.merchantId = (config.get<string>('payment.zarinpal.merchantId') ?? '').trim();
    this.apiBase = (config.get<string>('payment.zarinpal.baseUrl') ?? (sandbox ? SANDBOX_API_BASE : PRODUCTION_API_BASE)).replace(/\/+$/, '');
    this.startPayBase = (config.get<string>('payment.zarinpal.startPayUrl') ?? (sandbox ? SANDBOX_START_PAY_BASE : PRODUCTION_START_PAY_BASE)).replace(/\/+$/, '');
  }

  async request(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    if (!this.merchantId) {
      return { ok: false, error: 'ZARINPAL_MERCHANT_ID is not configured' };
    }

    const body = {
      merchant_id: this.merchantId,
      amount: this.toGatewayAmount(input.amount),
      callback_url: input.callbackUrl,
      description: input.description,
      mobile: input.mobile,
    };

    try {
      const payload = await this.post<ZarinpalRequestData>('request.json', body);
      const data = payload.data;
      if (data?.code === ZARINPAL_SUCCESS && data.authority) {
        return { ok: true, authority: data.authority, paymentUrl: this.startPayUrl(data.authority), raw: payload };
      }
      return { ok: false, error: describeError(data?.message, payload.errors, 'Zarinpal payment request failed'), raw: payload };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Zarinpal transport error' };
    }
  }

  async verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    if (!this.merchantId) {
      return { ok: false, error: 'ZARINPAL_MERCHANT_ID is not configured' };
    }

    const body = {
      merchant_id: this.merchantId,
      amount: this.toGatewayAmount(input.amount),
      authority: input.authority,
    };

    try {
      const payload = await this.post<ZarinpalVerifyData>('verify.json', body);
      const data = payload.data;
      if (data?.code === ZARINPAL_SUCCESS || data?.code === ZARINPAL_ALREADY_VERIFIED) {
        return { ok: true, refId: data.ref_id === undefined || data.ref_id === null ? undefined : String(data.ref_id), raw: payload };
      }
      return { ok: false, error: describeError(data?.message, payload.errors, 'Zarinpal payment verification failed'), raw: payload };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Zarinpal transport error' };
    }
  }

  startPayUrl(authority: string): string {
    return `${this.startPayBase}/${authority}`;
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<ZarinpalEnvelope<T>> {
    const res = await fetch(`${this.apiBase}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as ZarinpalEnvelope<T>;
  }

  /** Convert the store amount (Toman) to Zarinpal's unit (Rial), with its 1000 Rial minimum. */
  private toGatewayAmount(amount: number): number {
    return Math.max(1000, Math.floor(Number(amount) * 10));
  }
}
