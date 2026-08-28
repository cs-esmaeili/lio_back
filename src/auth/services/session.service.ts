import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import { PrismaService } from 'src/prisma/prisma.service';

interface SessionRef {
  id: string;
  userId: number;
  familyId: string;
  revokedAt: Date | null;
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  create(input: {
    userId: number;
    refreshTokenHash: string;
    ip?: string;
    userAgent?: string;
  }) {
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

  findByRefreshHash(refreshTokenHash: string) {
    return this.prisma.authSession.findUnique({ where: { refreshTokenHash } });
  }

  findById(id: string) {
    return this.prisma.authSession.findUnique({ where: { id } });
  }

  // Consume an old refresh token and issue its successor in the same family.
  // Any sign of reuse revokes the entire family.
  async rotate(
    oldSession: SessionRef,
    newHash: string,
    ip?: string,
    userAgent?: string,
  ) {
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
