import { Global, Module } from '@nestjs/common';
import { AuthorizationService } from './services/authorization.service';

/**
 * Provides `AuthorizationService` on its own, without depending on AuthModule.
 * This lets AuthModule inject it (for `showAdminPanel`) without a circular
 * module dependency, since AuthorizationModule imports AuthModule for guards.
 */
@Global()
@Module({
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationAccessModule {}
