import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiForbiddenResponse, ApiHeader, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { SiteSettingService } from './services/site-setting.service';
import { GetByKeyResponseDto } from './dtos/getByKey/get-by-key-response.dto';
import { UpsertByKeyRequestDto } from './dtos/upsertByKey/upsert-by-key-request.dto';
import { UpsertByKeyResponseDto } from './dtos/upsertByKey/upsert-by-key-response.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('site-settings')
export class SiteSettingController {
  constructor(private readonly siteSettings: SiteSettingService) {}

  @ApiOperation({ summary: 'Get a site setting by key (e.g. logo, description, slogan)' })
  @ApiParam({ name: 'key', type: String, example: 'logo' })
  @ApiOkResponse({ description: 'Setting payload', type: GetByKeyResponseDto })
  @ApiNotFoundResponse({ description: 'Setting not found, or private and the caller is not authenticated' })
  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get(':key')
  getByKey(@Param('key') key: string, @Req() req: Request): Promise<GetByKeyResponseDto> {
    return this.siteSettings.getByKey(key, Boolean(req.user));
  }

  @ApiOperation({ summary: 'Create or update a site setting by key' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'key', type: String, example: 'logo' })
  @ApiBody({ type: UpsertByKeyRequestDto })
  @ApiOkResponse({ description: 'Upserted setting', type: UpsertByKeyResponseDto })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('site:manage')
  @Put(':key')
  upsertByKey(@Param('key') key: string, @Body() body: UpsertByKeyRequestDto): Promise<UpsertByKeyResponseDto> {
    return this.siteSettings.upsertByKey(key, body.data, body.isPrivate);
  }
}
