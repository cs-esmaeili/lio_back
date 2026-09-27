import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
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
import { AttributeAdminService } from './services/attribute-admin.service';
import { CreateAttributeRequestDto } from './dtos/adminAttribute/create-attribute-request.dto';
import { UpdateAttributeRequestDto } from './dtos/adminAttribute/update-attribute-request.dto';
import { CreateAttributeValueRequestDto } from './dtos/adminAttribute/create-attribute-value-request.dto';
import { ListAdminAttributesResponseDto } from './dtos/adminAttribute/list-admin-attributes-response.dto';
import { GetAdminAttributeResponseDto } from './dtos/adminAttribute/get-admin-attribute-response.dto';
import { CreateAttributeResponseDto } from './dtos/adminAttribute/create-attribute-response.dto';
import { UpdateAttributeResponseDto } from './dtos/adminAttribute/update-attribute-response.dto';
import { DeleteAttributeResponseDto } from './dtos/adminAttribute/delete-attribute-response.dto';
import { CreateAttributeValueResponseDto } from './dtos/adminAttribute/create-attribute-value-response.dto';

@UseGuards(SessionAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin/attributes')
export class AttributeController {
  constructor(private readonly attributes: AttributeAdminService) {}

  @ApiOperation({ summary: 'List every attribute with its values' })
  @ApiOkResponse({ description: 'Attribute list', type: ListAdminAttributesResponseDto })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('attribute:read')
  @Get()
  async listAttributes(): Promise<ListAdminAttributesResponseDto> {
    return { attributes: await this.attributes.listAttributes() };
  }

  @ApiOperation({ summary: 'Get a single attribute with its values' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Attribute', type: GetAdminAttributeResponseDto })
  @ApiNotFoundResponse({ description: 'Attribute not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('attribute:read')
  @Get(':id')
  getAttribute(@Param('id', ParseIntPipe) id: number): Promise<GetAdminAttributeResponseDto> {
    return this.attributes.getAttribute(id);
  }

  @ApiOperation({ summary: 'Create an attribute' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: CreateAttributeRequestDto })
  @ApiCreatedResponse({ description: 'Created attribute', type: CreateAttributeResponseDto })
  @ApiConflictResponse({ description: 'Name already in use' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('attribute:manage')
  @Post()
  createAttribute(@Body() body: CreateAttributeRequestDto): Promise<CreateAttributeResponseDto> {
    return this.attributes.createAttribute(body);
  }

  @ApiOperation({ summary: 'Update an attribute' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateAttributeRequestDto })
  @ApiOkResponse({ description: 'Updated attribute', type: UpdateAttributeResponseDto })
  @ApiConflictResponse({ description: 'Name already in use' })
  @ApiNotFoundResponse({ description: 'Attribute not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('attribute:manage')
  @Patch(':id')
  updateAttribute(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateAttributeRequestDto): Promise<UpdateAttributeResponseDto> {
    return this.attributes.updateAttribute(id, body);
  }

  @ApiOperation({ summary: 'Delete an attribute that is not used by any product' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Attribute deleted', type: DeleteAttributeResponseDto })
  @ApiConflictResponse({ description: 'Attribute is used by one or more products' })
  @ApiNotFoundResponse({ description: 'Attribute not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('attribute:manage')
  @Delete(':id')
  deleteAttribute(@Param('id', ParseIntPipe) id: number): Promise<DeleteAttributeResponseDto> {
    return this.attributes.deleteAttribute(id);
  }

  @ApiOperation({ summary: 'Add a value to an attribute' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: CreateAttributeValueRequestDto })
  @ApiCreatedResponse({ description: 'Attribute with the new value', type: CreateAttributeValueResponseDto })
  @ApiConflictResponse({ description: 'The attribute already has this value' })
  @ApiNotFoundResponse({ description: 'Attribute not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('attribute:manage')
  @Post(':id/values')
  createValue(@Param('id', ParseIntPipe) id: number, @Body() body: CreateAttributeValueRequestDto): Promise<CreateAttributeValueResponseDto> {
    return this.attributes.createValue(id, body);
  }
}
