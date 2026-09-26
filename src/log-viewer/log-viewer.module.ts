import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { LogViewerController } from './log-viewer.controller';
import { LogViewerService } from './log-viewer.service';

/** Admin-only dashboard for browsing the files written by `AppLogger`. */
@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [LogViewerController],
  providers: [LogViewerService],
})
export class LogViewerModule {}
