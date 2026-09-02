import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { FileManagerController } from './file-manager.controller';
import { FileManagerService } from './services/file-manager.service';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [FileManagerController],
  providers: [FileManagerService],
})
export class FileManagerModule {}
