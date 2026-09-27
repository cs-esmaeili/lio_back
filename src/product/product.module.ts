import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { CategoryModule } from 'src/category/category.module';
import { ProductPublicController } from './product-public.controller';
import { ProductController } from './product.controller';
import { ProductSearchService } from './services/product-search.service';
import { ProductGlobalFilterService } from './services/product-global-filter.service';
import { ProductSortService } from './services/product-sort.service';
import { ProductDetailService } from './services/product-detail.service';
import { ProductAdminService } from './services/product-admin.service';
import { ProductRepository } from './repositories/product.repository';

@Module({
  imports: [CategoryModule, AuthModule, AuthorizationModule],
  controllers: [ProductPublicController, ProductController],
  providers: [ProductRepository, ProductSearchService, ProductGlobalFilterService, ProductSortService, ProductDetailService, ProductAdminService],
  exports: [ProductRepository],
})
export class ProductModule {}
