import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { PageSectionService } from './services/page-section.service';
import { CreateSectionRequestDto } from './dtos/createSection/create-section-request.dto';
import { CreateSectionResponseDto } from './dtos/createSection/create-section-response.dto';
import { GetSectionResponseDto } from './dtos/getSection/get-section-response.dto';
import { DeleteSectionDataQueryDto, PageSectionDataRequestDto } from './dtos/sectionData/section-data-request.dto';
import { UpdateSectionDataResponseDto } from './dtos/updateSectionData/update-section-data-response.dto';

@UseGuards(SessionAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin/page-sections')
export class PageSectionController {
  constructor(private readonly pageSections: PageSectionService) {}

  @ApiOperation({ summary: 'Create a page section' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: CreateSectionRequestDto })
  @ApiCreatedResponse({ description: 'Created section', type: CreateSectionResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @Post()
  createSection(@Body() body: CreateSectionRequestDto): Promise<CreateSectionResponseDto> {
    return this.pageSections.createSection(body);
  }

  @ApiOperation({ summary: 'Get a page section with its typed data' })
  @ApiParam({ name: 'id', type: Number, example: 50 })
  @ApiOkResponse({ description: 'Page section', type: GetSectionResponseDto })
  @ApiNotFoundResponse({ description: 'Section not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @Get(':id')
  getSection(@Param('id', ParseIntPipe) id: number): Promise<GetSectionResponseDto> {
    return this.pageSections.getSection({ id });
  }

  @ApiOperation({ summary: 'Create a section item' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 50 })
  @ApiBody({ type: PageSectionDataRequestDto })
  @ApiCreatedResponse({ description: 'Section with the new item', type: UpdateSectionDataResponseDto })
  @ApiNotFoundResponse({ description: 'Section not found' })
  @ApiBadRequestResponse({ description: 'Invalid section data or unknown files' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @Post(':id/data')
  createSectionData(@Param('id', ParseIntPipe) id: number, @Body() body: PageSectionDataRequestDto): Promise<UpdateSectionDataResponseDto> {
    return this.pageSections.createSectionData(id, body);
  }

  @ApiOperation({ summary: 'Update a single item of a page section' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 50 })
  @ApiBody({ type: PageSectionDataRequestDto })
  @ApiOkResponse({ description: 'Updated section', type: UpdateSectionDataResponseDto })
  @ApiNotFoundResponse({ description: 'Section or item not found' })
  @ApiBadRequestResponse({ description: 'Invalid section data or unknown files' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @Patch(':id/data')
  updateSectionData(@Param('id', ParseIntPipe) id: number, @Body() body: PageSectionDataRequestDto): Promise<UpdateSectionDataResponseDto> {
    return this.pageSections.updateSectionData(id, body);
  }

  @ApiOperation({ summary: 'Delete a single item of a page section' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 50 })
  @ApiQuery({ name: 'itemId', required: false, type: Number, description: 'Item id to remove. Omitted for singleton sections (INTRODUCTION).' })
  @ApiOkResponse({ description: 'Section without the deleted item', type: UpdateSectionDataResponseDto })
  @ApiNotFoundResponse({ description: 'Section or item not found' })
  @ApiBadRequestResponse({ description: 'itemId is required for this section type' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @Delete(':id/data')
  deleteSectionData(@Param('id', ParseIntPipe) id: number, @Query() query: DeleteSectionDataQueryDto): Promise<UpdateSectionDataResponseDto> {
    return this.pageSections.deleteSectionData(id, query);
  }
}
