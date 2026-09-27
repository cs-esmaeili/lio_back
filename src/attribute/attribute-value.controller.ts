import { Body, Controller, Delete, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBody, ApiConflictResponse, ApiCookieAuth, ApiForbiddenResponse, ApiHeader, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { AttributeAdminService } from './services/attribute-admin.service';
import { UpdateAttributeValueRequestDto } from './dtos/adminAttribute/update-attribute-value-request.dto';
import { UpdateAttributeValueResponseDto } from './dtos/adminAttribute/update-attribute-value-response.dto';
import { DeleteAttributeValueResponseDto } from './dtos/adminAttribute/delete-attribute-value-response.dto';

@UseGuards(SessionAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin/attribute-values')
export class AttributeValueController {
  constructor(private readonly attributes: AttributeAdminService) {}

  @ApiOperation({ summary: 'Update an attribute value' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateAttributeValueRequestDto })
  @ApiOkResponse({ description: 'Attribute with the updated value', type: UpdateAttributeValueResponseDto })
  @ApiConflictResponse({ description: 'The attribute already has this value' })
  @ApiNotFoundResponse({ description: 'Attribute value not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('attribute:manage')
  @Patch(':id')
  updateValue(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateAttributeValueRequestDto): Promise<UpdateAttributeValueResponseDto> {
    return this.attributes.updateValue(id, body);
  }

  @ApiOperation({ summary: 'Delete an attribute value that is not used by any product' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Attribute with the value removed', type: DeleteAttributeValueResponseDto })
  @ApiConflictResponse({ description: 'Attribute value is used by one or more products' })
  @ApiNotFoundResponse({ description: 'Attribute value not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('attribute:manage')
  @Delete(':id')
  deleteValue(@Param('id', ParseIntPipe) id: number): Promise<DeleteAttributeValueResponseDto> {
    return this.attributes.deleteValue(id);
  }
}
