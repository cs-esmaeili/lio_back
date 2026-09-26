import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationController } from './authorization.controller';
import { AuthorizationAccessModule } from './authorization-access.module';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [AuthModule, AuthorizationAccessModule],
  controllers: [AuthorizationController],
  providers: [PermissionsGuard],
  exports: [AuthorizationAccessModule, PermissionsGuard],
})
export class AuthorizationModule {}
