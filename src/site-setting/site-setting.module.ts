import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { SiteSettingController } from './site-setting.controller';
import { SiteSettingService } from './services/site-setting.service';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [SiteSettingController],
  providers: [SiteSettingService],
})
export class SiteSettingModule {}
