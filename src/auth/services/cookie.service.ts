import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Injectable()
export class CookieService {
  constructor(private readonly config: ConfigService) {}

  sessionTokenName(): string {
    return this.prefixed('session');
  }

  setSession(res: Response, token: string): void {
    res.cookie(this.sessionTokenName(), token, {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/',
      maxAge: this.ttlMs,
      ...(this.domain ? { domain: this.domain } : {}),
    });
  }

  clearSession(res: Response): void {
    res.clearCookie(this.sessionTokenName(), {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/',
      ...(this.domain ? { domain: this.domain } : {}),
    });
  }

  private prefixed(base: string): string {
    // __Host- requires Secure + Path=/ + no Domain (RFC 6265bis)
    if (this.secure && !this.domain) return `__Host-${base}`;
    return base;
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

  private get ttlMs(): number {
    return this.config.getOrThrow<number>('session.ttlDays') * 24 * 60 * 60 * 1000;
  }
}
