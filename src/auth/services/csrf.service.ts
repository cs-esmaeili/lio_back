import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';

@Injectable()
export class CsrfService {
  constructor(private readonly config: ConfigService) {}

  tokenName(): string {
    return 'csrf_token';
  }

  // Generates a token and sets it in a NON-HttpOnly cookie so the frontend
  // can read it and echo it back in the X-CSRF-Token header.
  generateCsrfToken(res: Response): string {
    const token = randomBytes(32).toString('base64url');
    res.cookie(this.tokenName(), token, {
      httpOnly: false,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      ...(this.domain ? { domain: this.domain } : {}),
    });
    return token;
  }

  // Double-submit check: header must match cookie. A cross-site request can
  // send the cookie but cannot set the custom header (CORS preflight blocks it).
  validate(req: Request): void {
    const cookieToken = req.cookies?.[this.tokenName()];
    const headerToken = req.get('x-csrf-token');
    if (
      !cookieToken ||
      !headerToken ||
      !this.safeEqual(cookieToken, headerToken)
    ) {
      throw new ForbiddenException('Invalid CSRF token');
    }
  }

  assertOrigin(req: Request): void {
    const origin = req.get('origin');
    if (!origin) return; // non-browser client
    if (origin !== this.config.getOrThrow<string>('app.origin')) {
      throw new ForbiddenException('Invalid origin');
    }
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  }

  private get secure(): boolean {
    return this.config.getOrThrow<boolean>('cookie.secure');
  }

  private get sameSite(): 'lax' | 'strict' | 'none' {
    return this.config.getOrThrow<'lax' | 'strict' | 'none'>('cookie.sameSite');
  }

  private get domain(): string | undefined {
    return this.config.get<string>('cookie.domain');
  }
}
