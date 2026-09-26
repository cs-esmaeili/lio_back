import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CartModule } from 'src/cart/cart.module';
import { AddressModule } from 'src/address/address.module';
import { SiteSettingModule } from 'src/site-setting/site-setting.module';
import { UsersModule } from 'src/users/users.module';
import { PaymentModule } from 'src/payment/payment.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './services/checkout.service';

@Module({
  imports: [AuthModule, CartModule, AddressModule, SiteSettingModule, UsersModule, PaymentModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
