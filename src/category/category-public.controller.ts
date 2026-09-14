import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CategoryService } from './services/category.service';
import { GetCategoriesResponseDto } from './dtos/getCategories/get-categories-response.dto';

@Controller('categories')
export class CategoryPublicController {
  constructor(private readonly categories: CategoryService) {}

  @ApiOperation({ summary: 'Get all site categories as a nested tree' })
  @ApiOkResponse({ description: 'Nested category tree', type: GetCategoriesResponseDto })
  @Get()
  getCategories(): Promise<GetCategoriesResponseDto> {
    return this.categories.getCategories();
  }
}
