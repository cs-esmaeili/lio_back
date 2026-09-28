import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import type { PaymentEligibilityReason, PaymentEligibilityRule } from '../services/payment-eligibility.service';

/** Profile fields the user must fill in before they can pay. */
const REQUIRED_PROFILE_FIELDS = ['name', 'lastName', 'nationalCode'] as const;

/**
 * Blocks payment until the user has completed the mandatory profile fields
 * (name, lastName and nationalCode). The shipping address is not checked here:
 * it is chosen and validated by the checkout address step.
 */
@Injectable()
export class ProfileCompletedRule implements PaymentEligibilityRule {
  constructor(private readonly users: UsersService) {}

  async check(userId: number): Promise<PaymentEligibilityReason | null> {
    const user = await this.users.findById(userId);
    const missing = REQUIRED_PROFILE_FIELDS.filter((field) => isBlank(user?.[field]));

    if (missing.length === 0) return null;

    return {
      code: 'PROFILE_INCOMPLETE',
      message: 'Complete your profile (name, lastName and nationalCode) before paying',
      fields: [...missing],
    };
  }
}

function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0;
}
