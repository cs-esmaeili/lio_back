import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
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
import { GetSectionResponseDto } from './dtos/getSection/get-section-response.dto';
import { UpdatePageSectionDataDto } from './dtos/updateSectionData/update-section-data-request.dto';
import { UpdateSectionDataResponseDto } from './dtos/updateSectionData/update-section-data-response.dto';

@Controller('admin/page-sections')
export class PageSectionController {
  constructor(private readonly pageSections: PageSectionService) {}

  @ApiOperation({ summary: 'Create a page section' })
  @ApiBody({ type: CreateSectionRequestDto })
  @ApiCreatedResponse({ description: 'Created section', type: CreateSectionResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  createSection(@Body() body: CreateSectionRequestDto): Promise<CreateSectionResponseDto> {
    return this.pageSections.createSection(body);
  }

  @ApiOperation({ summary: 'Get a page section with its typed data' })
  @ApiParam({ name: 'id', type: Number, example: 50 })
  @ApiOkResponse({ description: 'Page section', type: GetSectionResponseDto })
  @ApiNotFoundResponse({ description: 'Section not found' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get(':id')
  getSection(@Param('id', ParseIntPipe) id: number): Promise<GetSectionResponseDto> {
    return this.pageSections.getSection(id);
  }

  @ApiOperation({ summary: 'Update the typed data of a page section' })
  @ApiParam({ name: 'id', type: Number, example: 50 })
  @ApiBody({ type: UpdatePageSectionDataDto })
  @ApiOkResponse({ description: 'Updated section', type: UpdateSectionDataResponseDto })
  @ApiNotFoundResponse({ description: 'Section not found' })
  @ApiBadRequestResponse({ description: 'Invalid section data or unknown files' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('page:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/data')
  updateSectionData(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePageSectionDataDto): Promise<UpdateSectionDataResponseDto> {
    return this.pageSections.updateSectionData(id, body);
  }
}
