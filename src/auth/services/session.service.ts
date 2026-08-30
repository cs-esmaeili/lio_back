import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import type { Request, Response } from 'express';
import { UserStatus } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';
import { CsrfService } from './csrf.service';

interface SessionRef {
  id: string;
  userId: number;
  familyId: string;
  revokedAt: Date | null;
  expiresAt: Date;
}

export interface AuthUser {
  id: number;
  phone: string;
  name: string | null;
  lastName: string | null;
  username: string | null;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly cookies: CookieService,
    private readonly csrf: CsrfService,
  ) {}

  create(input: { userId: number; refreshTokenHash: string; ip?: string; userAgent?: string }) {
    return this.prisma.authSession.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        familyId: randomUUID(),
        expiresAt: this.newExpiry(),
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  }

  // Full login handshake: mint a refresh token, persist the session, set auth
  // cookies, rotate the CSRF token, and return the public user for the body.
  async establishSession(user: AuthUser, req: Request, res: Response): Promise<AuthUser> {
    const { raw, hash } = this.tokens.generateRefreshToken();
    const session = await this.create({
      userId: user.id,
      refreshTokenHash: hash,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    const accessToken = this.tokens.signAccessToken({
      sub: String(user.id),
      sid: session.id,
      jti: this.tokens.newJti(),
    });
    this.cookies.setAccessToken(res, accessToken);
    this.cookies.setRefreshToken(res, raw);
    this.csrf.generateCsrfToken(res); // fresh CSRF per session (anti-fixation)

    return this.publicUser(user);
  }

  // Refresh: consume the refresh-token cookie, rotate the session within its
  // family, reissue access/refresh cookies and CSRF, and return the user.
  async refresh(req: Request, res: Response): Promise<AuthUser> {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const raw = cookies?.[this.cookies.refreshTokenName()];
    if (!raw) throw new UnauthorizedException('No refresh token');

    const session = await this.findByRefreshHash(this.tokens.hashRefreshToken(raw));
    if (!session) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.users.findById(session.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.revokeAllForUser(session.userId);
      throw new UnauthorizedException('Account not active');
    }

    const next = this.tokens.generateRefreshToken();
    const newSession = await this.rotate(session, next.hash, req.ip, req.get('user-agent'));

    const accessToken = this.tokens.signAccessToken({
      sub: String(user.id),
      sid: newSession.id,
      jti: this.tokens.newJti(),
    });
    this.cookies.setAccessToken(res, accessToken);
    this.cookies.setRefreshToken(res, next.raw);
    this.csrf.generateCsrfToken(res);

    return this.publicUser(user);
  }

  // Logout: revoke the current session (if any) and clear auth cookies.
  async logout(sessionId: string | undefined, res: Response): Promise<void> {
    if (sessionId) {
      await this.revokeOne(sessionId);
    }
    this.cookies.clearAuthCookies(res);
  }

  private publicUser(user: AuthUser): AuthUser {
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      lastName: user.lastName,
      username: user.username,
    };
  }

  findByRefreshHash(refreshTokenHash: string) {
    return this.prisma.authSession.findUnique({ where: { refreshTokenHash } });
  }

  findById(id: string) {
    return this.prisma.authSession.findUnique({ where: { id } });
  }

  isActive(session: { revokedAt: Date | null; expiresAt: Date }): boolean {
    return !session.revokedAt && session.expiresAt > DateTime.now().toJSDate();
  }

  // Consume an old refresh token and issue its successor in the same family.
  // Any sign of reuse revokes the entire family.
  async rotate(oldSession: SessionRef, newHash: string, ip?: string, userAgent?: string) {
    const now = DateTime.now().toJSDate();
    if (oldSession.revokedAt || oldSession.expiresAt <= now) {
      await this.revokeFamily(oldSession.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    // Atomic claim: first refresher wins, concurrent one gets count 0.
    const claimed = await this.prisma.authSession.updateMany({
      where: { id: oldSession.id, revokedAt: null },
      data: { revokedAt: now, lastUsedAt: now },
    });
    if (claimed.count === 0) {
      await this.revokeFamily(oldSession.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return this.prisma.authSession.create({
      data: {
        userId: oldSession.userId,
        refreshTokenHash: newHash,
        familyId: oldSession.familyId,
        replacedById: oldSession.id,
        expiresAt: this.newExpiry(),
        ip,
        userAgent,
      },
    });
  }

  revokeOne(id: string) {
    return this.prisma.authSession.update({
      where: { id },
      data: { revokedAt: DateTime.now().toJSDate() },
    });
  }

  revokeAllForUser(userId: number) {
    return this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: DateTime.now().toJSDate() },
    });
  }

  revokeFamily(familyId: string) {
    return this.prisma.authSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: DateTime.now().toJSDate() },
    });
  }

  touch(id: string) {
    return this.prisma.authSession.update({
      where: { id },
      data: { lastUsedAt: DateTime.now().toJSDate() },
    });
  }

  private newExpiry(): Date {
    return DateTime.now()
      .plus({ days: this.config.getOrThrow<number>('jwt.refreshTtlDays') })
      .toJSDate();
  }
}
