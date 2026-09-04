import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { SiteSettingService } from './services/site-setting.service';
import { GetByKeyResponseDto } from './dtos/getByKey/get-by-key-response.dto';
import { UpsertByKeyRequestDto } from './dtos/upsertByKey/upsert-by-key-request.dto';
import { UpsertByKeyResponseDto } from './dtos/upsertByKey/upsert-by-key-response.dto';

@Controller('site-settings')
export class SiteSettingController {
  constructor(private readonly siteSettings: SiteSettingService) {}

  @ApiOperation({ summary: 'Get a site setting by key (e.g. header, footer)' })
  @ApiParam({ name: 'key', type: String, example: 'header' })
  @ApiOkResponse({ description: 'Setting payload', type: GetByKeyResponseDto })
  @ApiNotFoundResponse({ description: 'Setting not found' })
  @Get(':key')
  getByKey(@Param('key') key: string): Promise<GetByKeyResponseDto> {
    return this.siteSettings.getByKey(key);
  }

  @ApiOperation({ summary: 'Create or update a site setting by key' })
  @ApiParam({ name: 'key', type: String, example: 'footer' })
  @ApiBody({ type: UpsertByKeyRequestDto })
  @ApiOkResponse({ description: 'Upserted setting', type: UpsertByKeyResponseDto })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('site:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Put(':key')
  upsertByKey(@Param('key') key: string, @Body() body: UpsertByKeyRequestDto): Promise<UpsertByKeyResponseDto> {
    return this.siteSettings.upsertByKey(key, body.data);
  }
}
