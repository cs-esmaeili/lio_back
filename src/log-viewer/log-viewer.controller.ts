import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiExcludeEndpoint, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { renderLogViewerPage } from './log-viewer.page';
import { LogViewerService } from './log-viewer.service';
import { ListLogMetaResponseDto } from './dtos/listLogMeta/list-log-meta-response.dto';
import { ReadLogEntriesRequestDto } from './dtos/readLogEntries/read-log-entries-request.dto';
import { ReadLogEntriesResponseDto } from './dtos/readLogEntries/read-log-entries-response.dto';

/**
 * Admin log viewer. Access is limited to sessions holding the `log:read`
 * permission (the seeded `admin` role has every permission). The admin logs in
 * through the normal auth flow; this page never handles credentials itself.
 */
@UseGuards(SessionAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin/logs')
export class LogViewerController {
  constructor(private readonly viewer: LogViewerService) {}

  @ApiExcludeEndpoint()
  @Permissions('log:read')
  @Get()
  page(@Res() res: Response): void {
    res.type('html').send(renderLogViewerPage());
  }

  @ApiOperation({ summary: 'List available log dates and channels' })
  @ApiOkResponse({ description: 'Log metadata', type: ListLogMetaResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not logged in' })
  @ApiForbiddenResponse({ description: 'Missing log:read permission' })
  @ApiCookieAuth('session')
  @Permissions('log:read')
  @Get('meta')
  listLogMeta(): Promise<ListLogMetaResponseDto> {
    return this.viewer.listMeta();
  }

  @ApiOperation({ summary: 'Read filtered, paginated log entries for a date' })
  @ApiOkResponse({ description: 'Log entries', type: ReadLogEntriesResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not logged in' })
  @ApiForbiddenResponse({ description: 'Missing log:read permission' })
  @ApiCookieAuth('session')
  @Permissions('log:read')
  @Get('entries')
  readLogEntries(@Query() query: ReadLogEntriesRequestDto): Promise<ReadLogEntriesResponseDto> {
    return this.viewer.readEntries(query);
  }
}
