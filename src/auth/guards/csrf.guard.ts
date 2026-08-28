import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CsrfService } from '../services/csrf.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrf: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      return true;
    }
    this.csrf.assertOrigin(req);
    this.csrf.validate(req);
    return true;
  }
}
