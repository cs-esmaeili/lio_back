/** Injection token for the active SMS provider (selected by `SMS_PROVIDER`). */
export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

/**
 * Logical SMS templates. The concrete provider template name for each key is
 * configured through env (`KAVENEGAR_OTP_TEMPLATE`, ...), so application code
 * never hard-codes a provider-specific template name.
 */
export enum SmsTemplate {
  /** Login / signup one-time password. */
  OTP = 'otp',
  /** Order paid confirmation. */
  ORDER_PAID = 'orderPaid',
}
