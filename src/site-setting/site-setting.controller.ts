import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiForbiddenResponse, ApiHeader, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
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

  @ApiOperation({ summary: 'Get a site setting by key (e.g. header, footer)' })
  @ApiParam({ name: 'key', type: String, example: 'header' })
  @ApiOkResponse({ description: 'Setting payload', type: GetByKeyResponseDto })
  @ApiNotFoundResponse({ description: 'Setting not found' })
  @Public()
  @Get(':key')
  getByKey(@Param('key') key: string): Promise<GetByKeyResponseDto> {
    return this.siteSettings.getByKey(key);
  }

  @ApiOperation({ summary: 'Create or update a site setting by key' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'key', type: String, example: 'footer' })
  @ApiBody({ type: UpsertByKeyRequestDto })
  @ApiOkResponse({ description: 'Upserted setting', type: UpsertByKeyResponseDto })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('site:manage')
  @Put(':key')
  upsertByKey(@Param('key') key: string, @Body() body: UpsertByKeyRequestDto): Promise<UpsertByKeyResponseDto> {
    return this.siteSettings.upsertByKey(key, body.data);
  }
}
