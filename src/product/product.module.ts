import { Module } from '@nestjs/common';
import { CategoryModule } from 'src/category/category.module';
import { ProductPublicController } from './product-public.controller';
import { ProductSearchService } from './services/product-search.service';
import { ProductGlobalFilterService } from './services/product-global-filter.service';
import { ProductSortService } from './services/product-sort.service';
import { ProductRepository } from './repositories/product.repository';

@Module({
  imports: [CategoryModule],
  controllers: [ProductPublicController],
  providers: [ProductRepository, ProductSearchService, ProductGlobalFilterService, ProductSortService],
  exports: [ProductRepository],
})
export class ProductModule {}
