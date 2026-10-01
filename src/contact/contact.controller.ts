import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import { ContactFormService } from './services/contact-form.service';
import { SaveContactFormRequestDto } from './dtos/saveContactForm/save-contact-form-request.dto';
import { SaveContactFormResponseDto } from './dtos/saveContactForm/save-contact-form-response.dto';

@Controller('contact-form')
export class ContactController {
  constructor(private readonly contactForms: ContactFormService) {}

  @ApiOperation({ summary: 'Submit a contact form message' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: SaveContactFormRequestDto })
  @ApiCreatedResponse({ description: 'Saved message', type: SaveContactFormResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @Public()
  @UseGuards(CsrfGuard)
  @Post('save')
  save(@Body() body: SaveContactFormRequestDto): Promise<SaveContactFormResponseDto> {
    return this.contactForms.save(body);
  }
}
