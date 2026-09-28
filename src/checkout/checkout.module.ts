import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CartModule } from 'src/cart/cart.module';
import { AddressModule } from 'src/address/address.module';
import { SiteSettingModule } from 'src/site-setting/site-setting.module';
import { UsersModule } from 'src/users/users.module';
import { PaymentModule } from 'src/payment/payment.module';
import { CheckoutController } from './checkout.controller';
import { PaymentsController } from './payments.controller';
import { CheckoutService } from './services/checkout.service';
import { CheckoutPaymentService } from './services/checkout-payment.service';
import { OrderExpiryService } from './services/order-expiry.service';
import { PaymentEligibilityService } from './services/payment-eligibility.service';
import { PAYMENT_ELIGIBILITY_RULES } from './services/payment-eligibility.service';
import type { PaymentEligibilityRule } from './services/payment-eligibility.service';
import { ProfileCompletedRule } from './rules/profile-completed.rule';
import { CheckoutPaymentRepository } from './repositories/checkout-payment.repository';

@Module({
  imports: [AuthModule, CartModule, AddressModule, SiteSettingModule, UsersModule, PaymentModule],
  controllers: [CheckoutController, PaymentsController],
  providers: [
    CheckoutService,
    CheckoutPaymentService,
    OrderExpiryService,
    CheckoutPaymentRepository,
    PaymentEligibilityService,
    ProfileCompletedRule,
    {
      provide: PAYMENT_ELIGIBILITY_RULES,
      // Extend the returned array to add payment preconditions.
      useFactory: (profileCompleted: ProfileCompletedRule): PaymentEligibilityRule[] => [profileCompleted],
      inject: [ProfileCompletedRule],
    },
  ],
})
export class CheckoutModule {}
