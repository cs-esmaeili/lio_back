import { Global, Module } from '@nestjs/common';
import { FileUrlService } from './services/file-url.service';
import { PaginationService } from './services/pagination.service';

@Global()
@Module({
  providers: [FileUrlService, PaginationService],
  exports: [FileUrlService, PaginationService],
})
export class CommonModule {}
