/** Result of a single SMS send attempt. Failures never throw across the boundary. */
export interface SmsSendResult {
  ok: boolean;
  error?: string;
}

/**
 * Contract every SMS backend must implement. The rest of the application only
 * depends on `SmsService`, so adding a provider means implementing this
 * interface and wiring it in `SmsModule`.
 */
export interface SmsProvider {
  /** Send a one-time password using the provider's OTP template. */
  sendOtp(phone: string, code: string): Promise<SmsSendResult>;

  /**
   * Send a provider template with named tokens (Kavenegar supports
   * `token`, `token2`, `token3`, `token10`, `token20`).
   */
  sendPattern(phone: string, template: string, tokens: Record<string, string>): Promise<SmsSendResult>;
}
