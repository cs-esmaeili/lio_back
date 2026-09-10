import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Only allows the route through when DEV_AUTH=true. Otherwise the route
// behaves as if it does not exist (404) so it stays invisible in production.
@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (!this.config.get<boolean>('devAuth.enabled')) {
      throw new NotFoundException();
    }
    return true;
  }
}
