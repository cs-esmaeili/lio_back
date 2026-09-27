import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { CategoryAdminService } from './services/category-admin.service';
import { CreateCategoryRequestDto } from './dtos/adminCategory/create-category-request.dto';
import { UpdateCategoryRequestDto } from './dtos/adminCategory/update-category-request.dto';
import { ListAdminCategoriesResponseDto } from './dtos/adminCategory/list-admin-categories-response.dto';
import { GetAdminCategoryResponseDto } from './dtos/adminCategory/get-admin-category-response.dto';
import { CreateCategoryResponseDto } from './dtos/adminCategory/create-category-response.dto';
import { UpdateCategoryResponseDto } from './dtos/adminCategory/update-category-response.dto';
import { DeleteCategoryResponseDto } from './dtos/adminCategory/delete-category-response.dto';

@UseGuards(SessionAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin/categories')
export class CategoryController {
  constructor(private readonly categories: CategoryAdminService) {}

  @ApiOperation({ summary: 'List every category as a flat tree' })
  @ApiOkResponse({ description: 'Flat category list', type: ListAdminCategoriesResponseDto })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('category:read')
  @Get()
  async listCategories(): Promise<ListAdminCategoriesResponseDto> {
    return { categories: await this.categories.listCategories() };
  }

  @ApiOperation({ summary: 'Get a single category' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Category', type: GetAdminCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('category:read')
  @Get(':id')
  getCategory(@Param('id', ParseIntPipe) id: number): Promise<GetAdminCategoryResponseDto> {
    return this.categories.getCategory(id);
  }

  @ApiOperation({ summary: 'Create a category' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: CreateCategoryRequestDto })
  @ApiCreatedResponse({ description: 'Created category', type: CreateCategoryResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid parent or image file' })
  @ApiConflictResponse({ description: 'Slug already in use' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('category:manage')
  @Post()
  createCategory(@Body() body: CreateCategoryRequestDto): Promise<CreateCategoryResponseDto> {
    return this.categories.createCategory(body);
  }

  @ApiOperation({ summary: 'Update a category' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateCategoryRequestDto })
  @ApiOkResponse({ description: 'Updated category', type: UpdateCategoryResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid parent, cycle, or image file' })
  @ApiConflictResponse({ description: 'Slug already in use' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('category:manage')
  @Patch(':id')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCategoryRequestDto): Promise<UpdateCategoryResponseDto> {
    return this.categories.updateCategory(id, body);
  }

  @ApiOperation({ summary: 'Delete a category' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Category deleted', type: DeleteCategoryResponseDto })
  @ApiConflictResponse({ description: 'Category still has subcategories' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('category:manage')
  @Delete(':id')
  deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<DeleteCategoryResponseDto> {
    return this.categories.deleteCategory(id);
  }
}
