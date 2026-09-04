import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { HomeController } from './home.controller';
import { PageSectionController } from './page-section.controller';
import { HomeService } from './services/home.service';
import { PageSectionService } from './services/page-section.service';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [PageSectionController, HomeController],
  providers: [PageSectionService, HomeService],
})
export class PageSectionModule {}
