import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ProductSearchService } from './services/product-search.service';
import { ProductGlobalFilterService } from './services/product-global-filter.service';
import { ProductSortService } from './services/product-sort.service';
import { SearchProductsRequestDto } from './dtos/searchProducts/search-products-request.dto';
import { SearchProductsResponseDto } from './dtos/searchProducts/search-products-response.dto';
import { GetProductGlobalFiltersResponseDto } from './dtos/getProductGlobalFilters/get-product-global-filters-response.dto';
import { GetProductSortOptionsResponseDto } from './dtos/getProductSortOptions/get-product-sort-options-response.dto';

@Controller('products')
export class ProductPublicController {
  constructor(
    private readonly products: ProductSearchService,
    private readonly globalFilters: ProductGlobalFilterService,
    private readonly sorts: ProductSortService,
  ) {}

  @ApiOperation({ summary: 'Get the global product filter definitions' })
  @ApiOkResponse({ description: 'Global filters for the frontend', type: GetProductGlobalFiltersResponseDto })
  @Get('global-filters')
  getProductGlobalFilters(): GetProductGlobalFiltersResponseDto {
    return this.globalFilters.listDefinitions();
  }

  @ApiOperation({ summary: 'Get the product sort options' })
  @ApiOkResponse({ description: 'Sort options for the frontend', type: GetProductSortOptionsResponseDto })
  @Get('sort-options')
  getProductSortOptions(): GetProductSortOptionsResponseDto {
    return this.sorts.listOptions();
  }

  @ApiOperation({ summary: 'Search products by category slug, attribute filters, global filters and sort' })
  @ApiOkResponse({ description: 'Products matching the category and variant filters', type: SearchProductsResponseDto })
  @ApiBadRequestResponse({ description: 'Unknown attribute value or value/attribute mismatch' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @Post('search')
  searchProducts(@Body() body: SearchProductsRequestDto): Promise<SearchProductsResponseDto> {
    return this.products.searchProducts(body);
  }
}
