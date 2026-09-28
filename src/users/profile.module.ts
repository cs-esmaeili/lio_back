import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from './users.module';
import { ProfileController } from './profile.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
