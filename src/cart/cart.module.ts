import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CartController } from './cart.controller';
import { CartService } from './services/cart.service';
import { CartPricingService } from './services/cart-pricing.service';
import { CartRepository } from './repositories/cart.repository';

@Module({
  imports: [AuthModule],
  controllers: [CartController],
  providers: [CartRepository, CartService, CartPricingService],
  exports: [CartService, CartPricingService, CartRepository],
})
export class CartModule {}
