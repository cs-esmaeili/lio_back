import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PageSectionService } from './services/page-section.service';
import { GetSectionQueryDto } from './dtos/getSection/get-section-query.dto';
import { GetSectionResponseDto } from './dtos/getSection/get-section-response.dto';
import { GetPageSectionsQueryDto } from './dtos/getPageSections/get-page-sections-query.dto';
import { GetPageSectionsResponseDto } from './dtos/getPageSections/get-page-sections-response.dto';

@Controller('page-sections')
export class PageSectionPublicController {
  constructor(private readonly pageSections: PageSectionService) {}

  @ApiOperation({ summary: 'Get a single section by id or location with its typed data' })
  @ApiOkResponse({ description: 'Page section', type: GetSectionResponseDto })
  @ApiBadRequestResponse({ description: 'Neither id nor location provided' })
  @ApiNotFoundResponse({ description: 'Section not found' })
  @Get('section')
  getSection(@Query() query: GetSectionQueryDto): Promise<GetSectionResponseDto> {
    return this.pageSections.getSection(query);
  }

  @ApiOperation({ summary: 'Get a page with its active sections by entity type' })
  @ApiOkResponse({ description: 'Page with its active sections', type: GetPageSectionsResponseDto })
  @ApiNotFoundResponse({ description: 'Page not found' })
  @Get('page')
  getPageSections(@Query() query: GetPageSectionsQueryDto): Promise<GetPageSectionsResponseDto> {
    return this.pageSections.getPageSections(query);
  }
}
