import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { PageSectionController } from './page-section.controller';
import { PageSectionService } from './services/page-section.service';
import { SliderSectionService } from './services/slider-section.service';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [PageSectionController],
  providers: [PageSectionService, SliderSectionService],
})
export class PageSectionModule {}
