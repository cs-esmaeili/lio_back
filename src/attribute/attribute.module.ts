import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { AttributeController } from './attribute.controller';
import { AttributeValueController } from './attribute-value.controller';
import { AttributeAdminService } from './services/attribute-admin.service';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [AttributeController, AttributeValueController],
  providers: [AttributeAdminService],
})
export class AttributeModule {}
