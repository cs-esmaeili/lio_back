import { Global, Module } from '@nestjs/common';
import { FileUrlService } from './services/file-url.service';

@Global()
@Module({
  providers: [FileUrlService],
  exports: [FileUrlService],
})
export class CommonModule {}
