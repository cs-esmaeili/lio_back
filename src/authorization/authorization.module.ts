import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationController } from './authorization.controller';
import { AuthorizationService } from './services/authorization.service';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [AuthModule],
  controllers: [AuthorizationController],
  providers: [AuthorizationService, PermissionsGuard],
  exports: [AuthorizationService, PermissionsGuard],
})
export class AuthorizationModule {}
