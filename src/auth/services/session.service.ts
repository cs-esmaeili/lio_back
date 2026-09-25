import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import type { Request, Response } from 'express';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { UserStatus, authSessions } from 'src/database/schema';
import { UsersService } from 'src/users/users.service';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';
import { CsrfService } from './csrf.service';

type SessionRecord = typeof authSessions.$inferSelect;

export interface AuthUser {
  id: number;
  username: string;
  name: string | null;
  lastName: string | null;
}

export interface ResolvedSession {
  user: AuthUser;
  sessionId: string;
  // True when the sliding expiry was pushed forward during this request.
  extended: boolean;
}

@Injectable()
export class SessionService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly cookies: CookieService,
    private readonly csrf: CsrfService,
  ) {}

  // Full login handshake: mint an opaque session token, persist it, set the
  // HttpOnly session cookie, rotate the CSRF token, and return the user.
  async establishSession(user: AuthUser, req: Request, res: Response): Promise<AuthUser> {
    const { raw, hash } = this.tokens.generateSessionToken();
    await this.create({
      userId: user.id,
      tokenHash: hash,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    this.cookies.setSession(res, raw);
    this.csrf.generateCsrfToken(res); // fresh CSRF per session (anti-fixation)

    return this.publicUser(user);
  }

  // Validate a raw session token: existence, revocation, sliding and absolute
  // expiry, and the owning account status. Extends the sliding expiry and
  // returns the resolved user, or null when the session is not usable.
  async resolve(raw: string): Promise<ResolvedSession | null> {
    const session = await this.findByTokenHash(this.tokens.hashSessionToken(raw));
    if (!session || !this.isActive(session)) {
      return null;
    }

    if (this.isAbsolutelyExpired(session)) {
      await this.revokeOne(session.id);
      return null;
    }

    const user = await this.users.findById(session.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.revokeAllForUser(session.userId);
      return null;
    }

    const extended = await this.extendIfNeeded(session);

    return { user: this.publicUser(user), sessionId: session.id, extended };
  }

  // Logout: revoke the current session (if any) and clear the session cookie.
  async logout(sessionId: string | undefined, res: Response): Promise<void> {
    if (sessionId) {
      await this.revokeOne(sessionId);
    }
    this.cookies.clearSession(res);
  }

  private async create(input: { userId: number; tokenHash: string; ip?: string; userAgent?: string }) {
    const [session] = await this.db
      .insert(authSessions)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: this.newExpiry(),
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      })
      .returning();
    return session;
  }

  private publicUser(user: AuthUser): AuthUser {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      lastName: user.lastName,
    };
  }

  private findByTokenHash(tokenHash: string) {
    return this.db.query.authSessions.findFirst({ where: eq(authSessions.tokenHash, tokenHash) });
  }

  private isActive(session: Pick<SessionRecord, 'revokedAt' | 'expiresAt'>): boolean {
    return !session.revokedAt && session.expiresAt > DateTime.now().toJSDate();
  }

  private isAbsolutelyExpired(session: Pick<SessionRecord, 'createdAt'>): boolean {
    const absoluteExpiry = DateTime.fromJSDate(session.createdAt).plus({ days: this.absoluteDays });
    return DateTime.now() > absoluteExpiry;
  }

  // Push the sliding expiry forward, but only once the session is past the
  // halfway point of its lifetime — this keeps writes to at most one per half TTL.
  private async extendIfNeeded(session: Pick<SessionRecord, 'id' | 'expiresAt'>): Promise<boolean> {
    const now = DateTime.now();
    const remainingMs = DateTime.fromJSDate(session.expiresAt).diff(now).as('milliseconds');
    const halfTtlMs = (this.ttlDays * 24 * 60 * 60 * 1000) / 2;
    if (remainingMs >= halfTtlMs) {
      return false;
    }

    await this.db.update(authSessions).set({ expiresAt: this.newExpiry(), lastUsedAt: now.toJSDate() }).where(eq(authSessions.id, session.id));
    return true;
  }

  async revokeOne(id: string) {
    await this.db.update(authSessions).set({ revokedAt: DateTime.now().toJSDate() }).where(eq(authSessions.id, id));
  }

  async revokeAllForUser(userId: number) {
    await this.db
      .update(authSessions)
      .set({ revokedAt: DateTime.now().toJSDate() })
      .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
  }

  async revokeAllForUserExcept(userId: number, exceptSessionId: string) {
    await this.db
      .update(authSessions)
      .set({ revokedAt: DateTime.now().toJSDate() })
      .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt), ne(authSessions.id, exceptSessionId)));
  }

  private newExpiry(): Date {
    return DateTime.now().plus({ days: this.ttlDays }).toJSDate();
  }

  private get ttlDays(): number {
    return this.config.getOrThrow<number>('session.ttlDays');
  }

  private get absoluteDays(): number {
    return this.config.getOrThrow<number>('session.absoluteDays');
  }
}
