import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CategoryService } from './services/category.service';
import { GetCategoriesResponseDto } from './dtos/getCategories/get-categories-response.dto';
import { GetCategoryFiltersResponseDto } from './dtos/getCategoryFilters/get-category-filters-response.dto';

@Controller('categories')
export class CategoryPublicController {
  constructor(private readonly categories: CategoryService) {}

  @ApiOperation({ summary: 'Get all site categories as a nested tree' })
  @ApiOkResponse({ description: 'Nested category tree', type: GetCategoriesResponseDto })
  @Get()
  getCategories(): Promise<GetCategoriesResponseDto> {
    return this.categories.getCategories();
  }

  @ApiOperation({ summary: 'Get the filter configuration for a category by slug' })
  @ApiOkResponse({ description: 'Filterable attributes with their types and values', type: GetCategoryFiltersResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @Get(':slug/filters')
  getCategoryFilters(@Param('slug') slug: string): Promise<GetCategoryFiltersResponseDto> {
    return this.categories.getCategoryFilters(slug);
  }
}
