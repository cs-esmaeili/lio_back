import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { ContactController } from './contact.controller';
import { ContactAdminController } from './contact.admin.controller';
import { ContactFormService } from './services/contact-form.service';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [ContactController, ContactAdminController],
  providers: [ContactFormService],
})
export class ContactModule {}
