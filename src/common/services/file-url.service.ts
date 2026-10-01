import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toFileUrl } from '../utils/file-url';

@Injectable()
export class FileUrlService {
  private readonly urlPrefix: string;
  private readonly appUrl: string;

  constructor(config: ConfigService) {
    this.urlPrefix = config.getOrThrow<string>('uploads.urlPrefix');
    this.appUrl = config.getOrThrow<string>('app.url');
  }

  toUrl(filePath: string | null | undefined): string | null {
    return toFileUrl(filePath, this.urlPrefix, this.appUrl);
  }
}
