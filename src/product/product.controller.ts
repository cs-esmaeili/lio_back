import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { ProductAdminService } from './services/product-admin.service';
import { ListAdminProductsRequestDto } from './dtos/adminProduct/list-admin-products-request.dto';
import { ListAdminProductsResponseDto } from './dtos/adminProduct/list-admin-products-response.dto';
import { GetAdminProductResponseDto } from './dtos/adminProduct/get-admin-product-response.dto';
import { GetAvailableAttributesRequestDto } from './dtos/adminProduct/get-available-attributes-request.dto';
import { GetAvailableAttributesResponseDto } from './dtos/adminProduct/get-available-attributes-response.dto';
import { CreateProductRequestDto } from './dtos/adminProduct/create-product-request.dto';
import { UpdateProductRequestDto } from './dtos/adminProduct/update-product-request.dto';
import { CreateProductResponseDto } from './dtos/adminProduct/create-product-response.dto';
import { UpdateProductResponseDto } from './dtos/adminProduct/update-product-response.dto';
import { DeleteProductResponseDto } from './dtos/adminProduct/delete-product-response.dto';

@UseGuards(SessionAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin/products')
export class ProductController {
  constructor(private readonly products: ProductAdminService) {}

  @ApiOperation({ summary: 'List products with pagination, search and category filter' })
  @ApiOkResponse({ description: 'Paginated product list', type: ListAdminProductsResponseDto })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('product:read')
  @Get()
  listProducts(@Query() query: ListAdminProductsRequestDto): Promise<ListAdminProductsResponseDto> {
    return this.products.listProducts(query);
  }

  @ApiOperation({ summary: 'Get the attributes available for the given categories' })
  @ApiOkResponse({ description: 'Attributes derived from the category assignment', type: GetAvailableAttributesResponseDto })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('product:read')
  @Get('available-attributes')
  async getAvailableAttributes(@Query() query: GetAvailableAttributesRequestDto): Promise<GetAvailableAttributesResponseDto> {
    return { attributes: await this.products.getAvailableAttributes(query.categoryIds ?? []) };
  }

  @ApiOperation({ summary: 'Get a product with its images, attributes and variants' })
  @ApiParam({ name: 'id', type: Number, example: 3342 })
  @ApiOkResponse({ description: 'Product editor payload', type: GetAdminProductResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('product:read')
  @Get(':id')
  getProduct(@Param('id', ParseIntPipe) id: number): Promise<GetAdminProductResponseDto> {
    return this.products.getProduct(id);
  }

  @ApiOperation({ summary: 'Create a product with its images, attributes and variants' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: CreateProductRequestDto })
  @ApiCreatedResponse({ description: 'Created product', type: CreateProductResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid category, file, attribute or variant selection' })
  @ApiConflictResponse({ description: 'Slug or SKU already in use' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('product:manage')
  @Post()
  createProduct(@Body() body: CreateProductRequestDto): Promise<CreateProductResponseDto> {
    return this.products.createProduct(body);
  }

  @ApiOperation({ summary: 'Update a product; omitted fields keep their current values' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 3342 })
  @ApiBody({ type: UpdateProductRequestDto })
  @ApiOkResponse({ description: 'Updated product', type: UpdateProductResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid category, file, attribute or variant selection' })
  @ApiConflictResponse({ description: 'Slug or SKU already in use' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('product:manage')
  @Patch(':id')
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateProductRequestDto): Promise<UpdateProductResponseDto> {
    return this.products.updateProduct(id, body);
  }

  @ApiOperation({ summary: 'Delete a product and its images, variants and attribute links' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 3342 })
  @ApiOkResponse({ description: 'Product deleted', type: DeleteProductResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('product:manage')
  @Delete(':id')
  deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<DeleteProductResponseDto> {
    return this.products.deleteProduct(id);
  }
}
