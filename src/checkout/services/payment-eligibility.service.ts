import { ConflictException, Inject, Injectable } from '@nestjs/common';

/** Stable machine-readable reason codes returned to the client. */
export type PaymentEligibilityReasonCode = 'PROFILE_INCOMPLETE';

/** A single unmet payment requirement. */
export interface PaymentEligibilityReason {
  code: PaymentEligibilityReasonCode;
  message: string;
  /** Related fields (e.g. profile fields) when the reason maps to specific ones. */
  fields?: string[];
}

export interface PaymentEligibilityResult {
  eligible: boolean;
  reasons: PaymentEligibilityReason[];
}

/** Structural view accepted by {@link PaymentEligibilityService.assertEligible}. */
export interface PaymentEligibilityView {
  eligible: boolean;
  reasons: ReadonlyArray<{ code: string; message: string; fields?: string[] }>;
}

/**
 * One payment precondition. Add future conditions by implementing this
 * interface and registering the class as a `PAYMENT_ELIGIBILITY_RULES`
 * provider in `CheckoutModule`.
 */
export interface PaymentEligibilityRule {
  check(userId: number): Promise<PaymentEligibilityReason | null>;
}

/** DI token for the ordered list of payment eligibility rules. */
export const PAYMENT_ELIGIBILITY_RULES = Symbol('PAYMENT_ELIGIBILITY_RULES');

/** Top-level error code returned when a payment attempt is blocked. */
export const PAYMENT_NOT_ALLOWED = 'PAYMENT_NOT_ALLOWED';

/**
 * Evaluates every registered rule against the current user and reports which
 * payment requirements are unmet. Rules are independent, so one failing rule
 * never hides the others; adding a rule needs no change here.
 */
@Injectable()
export class PaymentEligibilityService {
  constructor(@Inject(PAYMENT_ELIGIBILITY_RULES) private readonly rules: PaymentEligibilityRule[]) {}

  async check(userId: number): Promise<PaymentEligibilityResult> {
    const results = await Promise.all(this.rules.map((rule) => rule.check(userId)));
    const reasons = results.filter((reason): reason is PaymentEligibilityReason => reason !== null);
    return { eligible: reasons.length === 0, reasons };
  }

  /** Throws a structured `409` when the user may not start a payment. */
  assertEligible(result: PaymentEligibilityView): void {
    if (result.eligible) return;
    throw new ConflictException({
      message: 'Payment requirements are not met',
      code: PAYMENT_NOT_ALLOWED,
      reasons: result.reasons,
    });
  }
}
