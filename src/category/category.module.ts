import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { CategoryController } from './category.controller';
import { CategoryPublicController } from './category-public.controller';
import { CategoryService } from './services/category.service';
import { CategoryAdminService } from './services/category-admin.service';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [CategoryPublicController, CategoryController],
  providers: [CategoryService, CategoryAdminService],
  exports: [CategoryService],
})
export class CategoryModule {}
