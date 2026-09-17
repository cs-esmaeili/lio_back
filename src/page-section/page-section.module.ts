import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { PageSectionController } from './page-section.controller';
import { PageSectionPublicController } from './page-section-public.controller';
import { PageSectionService } from './services/page-section.service';
import { SliderSectionService } from './services/slider-section.service';
import { ProductListSectionService } from './services/product-list-section.service';
import { BannerSectionService } from './services/banner-section.service';
import { IntroductionSectionService } from './services/introduction-section.service';
import { HeaderSectionService } from './services/header-section.service';
import { FooterSectionService } from './services/footer-section.service';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [PageSectionController, PageSectionPublicController],
  providers: [PageSectionService, SliderSectionService, ProductListSectionService, BannerSectionService, IntroductionSectionService, HeaderSectionService, FooterSectionService],
})
export class PageSectionModule {}
