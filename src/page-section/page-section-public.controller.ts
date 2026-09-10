import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PageSectionService } from './services/page-section.service';
import { GetPageSectionsQueryDto } from './dtos/getPageSections/get-page-sections-query.dto';
import { GetPageSectionsResponseDto } from './dtos/getPageSections/get-page-sections-response.dto';

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
}
