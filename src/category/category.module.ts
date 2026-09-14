import { Module } from '@nestjs/common';
import { CategoryPublicController } from './category-public.controller';
import { CategoryService } from './services/category.service';

@Module({
  controllers: [CategoryPublicController],
  providers: [CategoryService],
})
export class CategoryModule {}
