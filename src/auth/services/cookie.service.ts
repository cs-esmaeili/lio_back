import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Injectable()
export class CookieService {
  constructor(private readonly config: ConfigService) {}

  accessTokenName(): string {
    return this.prefixed('access_token');
  }

  refreshTokenName(): string {
    return this.prefixed('refresh_token');
  }

  setAccessToken(res: Response, token: string): void {
    res.cookie(this.accessTokenName(), token, {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/',
      maxAge: this.accessTtlSeconds * 1000,
      ...(this.domain ? { domain: this.domain } : {}),
    });
  }

  setRefreshToken(res: Response, token: string): void {
    res.cookie(this.refreshTokenName(), token, {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/',
      maxAge: this.refreshTtlDays * 24 * 60 * 60 * 1000,
      ...(this.domain ? { domain: this.domain } : {}),
    });
  }

  clearAccessToken(res: Response): void {
    res.clearCookie(this.accessTokenName(), {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/',
    });
  }

  clearRefreshToken(res: Response): void {
    res.clearCookie(this.refreshTokenName(), {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/',
    });
  }

  clearAuthCookies(res: Response): void {
    this.clearAccessToken(res);
    this.clearRefreshToken(res);
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

  private get accessTtlSeconds(): number {
    return this.config.getOrThrow<number>('jwt.accessTtlSeconds');
  }

  private get refreshTtlDays(): number {
    return this.config.getOrThrow<number>('jwt.refreshTtlDays');
  }
}
