import { Module } from '@nestjs/common';
import { ProductPublicController } from './product-public.controller';
import { ProductSearchService } from './services/product-search.service';
import { ProductRepository } from './repositories/product.repository';

@Module({
  controllers: [ProductPublicController],
  providers: [ProductRepository, ProductSearchService],
  exports: [ProductRepository],
})
export class ProductModule {}
