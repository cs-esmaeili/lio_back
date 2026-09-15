import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PageSectionService } from './services/page-section.service';
import { GetPageSectionsQueryDto } from './dtos/getPageSections/get-page-sections-query.dto';
import { GetPageSectionsResponseDto } from './dtos/getPageSections/get-page-sections-response.dto';
import { GetSectionResponseDto } from './dtos/getSection/get-section-response.dto';

@Controller('page-sections')
export class PageSectionPublicController {
  constructor(private readonly pageSections: PageSectionService) {}

  @ApiOperation({ summary: 'Get all active sections of a page by page id or entity' })
  @ApiOkResponse({ description: 'Page with its active sections', type: GetPageSectionsResponseDto })
  @ApiBadRequestResponse({ description: 'Neither id nor entityType provided' })
  @ApiNotFoundResponse({ description: 'Page not found' })
  @Get()
  getPageSections(@Query() query: GetPageSectionsQueryDto): Promise<GetPageSectionsResponseDto> {
    return this.pageSections.getPageSections(query);
  }

  @ApiOperation({ summary: 'Get a single section by id with its typed data' })
  @ApiParam({ name: 'id', type: Number, example: 42 })
  @ApiOkResponse({ description: 'Page section', type: GetSectionResponseDto })
  @ApiNotFoundResponse({ description: 'Section not found' })
  @Get(':id')
  getSection(@Param('id', ParseIntPipe) id: number): Promise<GetSectionResponseDto> {
    return this.pageSections.getSection(id);
  }
}
