import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { UsersModule } from './users.module';
import { AdminUsersController } from './admin-users.controller';

@Module({
  imports: [AuthModule, AuthorizationModule, UsersModule],
  controllers: [AdminUsersController],
})
export class AdminUsersModule {}
