import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { ContactFormService } from './services/contact-form.service';
import { ListContactFormsResponseDto } from './dtos/listContactForms/list-contact-forms-response.dto';

@UseGuards(SessionAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin/contact-forms')
export class ContactAdminController {
  constructor(private readonly contactForms: ContactFormService) {}

  @ApiOperation({ summary: 'List all contact form messages' })
  @ApiOkResponse({ description: 'Messages', type: ListContactFormsResponseDto, isArray: true })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('contact:manage')
  @Get()
  list(): Promise<ListContactFormsResponseDto[]> {
    return this.contactForms.list();
  }
}
