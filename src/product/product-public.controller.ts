import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ProductSearchService } from './services/product-search.service';
import { SearchProductsRequestDto } from './dtos/searchProducts/search-products-request.dto';
import { SearchProductsResponseDto } from './dtos/searchProducts/search-products-response.dto';

@Controller('products')
export class ProductPublicController {
  constructor(private readonly products: ProductSearchService) {}

  @ApiOperation({ summary: 'Search products by category slug and attribute value filters' })
  @ApiOkResponse({ description: 'Products matching the category and variant filters', type: SearchProductsResponseDto })
  @ApiBadRequestResponse({ description: 'Unknown attribute value or value/attribute mismatch' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @Post('search')
  searchProducts(@Body() body: SearchProductsRequestDto): Promise<SearchProductsResponseDto> {
    return this.products.searchProducts(body);
  }
}
