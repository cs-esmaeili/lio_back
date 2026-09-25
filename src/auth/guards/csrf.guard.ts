import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CsrfService } from '../services/csrf.service';
import type { SessionRequest } from '../session-user';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrf: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<SessionRequest>();
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      return true;
    }
    // Bearer-authenticated clients (mobile/API) cannot be CSRF'd: the browser
    // never attaches the header automatically, so only cookie sessions need it.
    if (req.authVia === 'bearer') {
      return true;
    }
    this.csrf.assertOrigin(req);
    this.csrf.validate(req);
    return true;
  }
}
