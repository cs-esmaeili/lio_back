import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CookieService } from '../services/cookie.service';
import { SessionService } from '../services/session.service';
import { attachSessionUser } from '../session-user';
import { extractSessionCredential } from '../utils/extract-session-credential';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cookies: CookieService,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const credential = extractSessionCredential(req, this.cookies.sessionTokenName());
    if (!credential) {
      throw new UnauthorizedException();
    }

    const resolved = await this.sessions.resolve(credential.raw);
    if (!resolved) {
      if (credential.via === 'cookie') {
        this.cookies.clearSession(res);
      }
      throw new UnauthorizedException();
    }

    if (resolved.extended && credential.via === 'cookie') {
      this.cookies.setSession(res, credential.raw);
    }

    attachSessionUser(req, { userId: resolved.user.id, username: resolved.user.username, sessionId: resolved.sessionId }, credential.via);
    return true;
  }
}
