import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { PageSectionService } from './services/page-section.service';
import { CreateSectionRequestDto } from './dtos/createSection/create-section-request.dto';
import { CreateSectionResponseDto } from './dtos/createSection/create-section-response.dto';
import { DeleteSectionResponseDto } from './dtos/deleteSection/delete-section-response.dto';
import { ListSectionsRequestDto } from './dtos/listSections/list-sections-request.dto';
import { ListSectionsResponseDto } from './dtos/listSections/list-sections-response.dto';
import { ReorderSectionsRequestDto } from './dtos/reorderSections/reorder-sections-request.dto';
import { ReorderSectionsResponseDto } from './dtos/reorderSections/reorder-sections-response.dto';
import { UpdateSectionRequestDto } from './dtos/updateSection/update-section-request.dto';
import { UpdateSectionResponseDto } from './dtos/updateSection/update-section-response.dto';

@Controller('admin/page-sections')
export class PageSectionController {
  constructor(private readonly pageSections: PageSectionService) {}

  @ApiOperation({ summary: 'List page sections (optionally filtered)' })
  @ApiOkResponse({ description: 'Page sections', type: ListSectionsResponseDto, isArray: true })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  listSections(@Query() query: ListSectionsRequestDto): Promise<ListSectionsResponseDto[]> {
    return this.pageSections.listSections(query);
  }

  @ApiOperation({ summary: 'Create a page section' })
  @ApiBody({ type: CreateSectionRequestDto })
  @ApiCreatedResponse({ description: 'Created section', type: CreateSectionResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid section data for the given type' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  createSection(@Body() body: CreateSectionRequestDto): Promise<CreateSectionResponseDto> {
    return this.pageSections.createSection(body);
  }

  @ApiOperation({ summary: 'Update a page section' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateSectionRequestDto })
  @ApiOkResponse({ description: 'Updated section', type: UpdateSectionResponseDto })
  @ApiNotFoundResponse({ description: 'Section not found' })
  @ApiBadRequestResponse({ description: 'Invalid section data for the section type' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id')
  updateSection(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateSectionRequestDto): Promise<UpdateSectionResponseDto> {
    return this.pageSections.updateSection(id, body);
  }

  @ApiOperation({ summary: 'Delete a page section' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Deleted', type: DeleteSectionResponseDto })
  @ApiNotFoundResponse({ description: 'Section not found' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  deleteSection(@Param('id', ParseIntPipe) id: number): Promise<DeleteSectionResponseDto> {
    return this.pageSections.deleteSection(id);
  }

  @ApiOperation({ summary: 'Reorder the sections of a page' })
  @ApiBody({ type: ReorderSectionsRequestDto })
  @ApiOkResponse({ description: 'Reordered', type: ReorderSectionsResponseDto })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch('reorder')
  reorderSections(@Body() body: ReorderSectionsRequestDto): Promise<ReorderSectionsResponseDto> {
    return this.pageSections.reorderSections(body);
  }
}
