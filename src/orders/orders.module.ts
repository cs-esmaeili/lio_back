import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { ProfileOrdersController } from './profile-orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersService } from './services/orders.service';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [ProfileOrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
