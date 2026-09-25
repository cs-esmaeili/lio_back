import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CookieService } from '../services/cookie.service';
import { SessionService } from '../services/session.service';
import { attachSessionUser } from '../session-user';
import { extractSessionCredential } from '../utils/extract-session-credential';

// Authenticates when a valid session is present, otherwise passes through
// unauthenticated (req.user stays undefined). Used by /auth/me and the cart.
@Injectable()
export class OptionalSessionAuthGuard implements CanActivate {
  constructor(
    private readonly cookies: CookieService,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const credential = extractSessionCredential(req, this.cookies.sessionTokenName());
    if (!credential) {
      return true;
    }

    const resolved = await this.sessions.resolve(credential.raw);
    if (!resolved) {
      if (credential.via === 'cookie') {
        this.cookies.clearSession(res);
      }
      return true;
    }

    if (resolved.extended && credential.via === 'cookie') {
      this.cookies.setSession(res, credential.raw);
    }

    attachSessionUser(req, { userId: resolved.user.id, username: resolved.user.username, sessionId: resolved.sessionId }, credential.via);
    return true;
  }
}
