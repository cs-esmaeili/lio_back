import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { DateTime } from 'luxon';
import { and, desc, eq, gt, gte, isNull, sql } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { OtpPurpose, otps } from 'src/database/schema';

@Injectable()
export class OtpService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly config: ConfigService,
  ) {}

  async request(phone: string, purpose: OtpPurpose): Promise<string> {
    await this.assertRequestAllowed(phone);

    const now = DateTime.now();

    // single active OTP per phone+purpose: invalidate previous unused ones
    await this.db
      .update(otps)
      .set({ usedAt: now.toJSDate() })
      .where(and(eq(otps.phone, phone), eq(otps.purpose, purpose), isNull(otps.usedAt)));

    const code = this.generateCode();
    await this.db.insert(otps).values({
      phone,
      purpose,
      codeHash: this.hashCode(code),
      expiresAt: now.plus({ seconds: this.ttlSeconds }).toJSDate(),
    });

    return code;
  }

  async verify(phone: string, purpose: OtpPurpose, code: string): Promise<boolean> {
    const otp = await this.db.query.otps.findFirst({
      where: and(eq(otps.phone, phone), eq(otps.purpose, purpose), isNull(otps.usedAt), gt(otps.expiresAt, DateTime.now().toJSDate())),
      orderBy: desc(otps.createdAt),
    });
    if (!otp) return false;

    if (otp.attempts >= this.maxAttempts) {
      await this.db.update(otps).set({ usedAt: DateTime.now().toJSDate() }).where(eq(otps.id, otp.id));
      return false;
    }

    if (!this.codesEqual(otp.codeHash, this.hashCode(code))) {
      await this.db
        .update(otps)
        .set({ attempts: sql`${otps.attempts} + 1` })
        .where(eq(otps.id, otp.id));
      return false;
    }

    // atomic single-use consume (guards against concurrent replay)
    const consumed = await this.db
      .update(otps)
      .set({ usedAt: DateTime.now().toJSDate() })
      .where(and(eq(otps.id, otp.id), isNull(otps.usedAt)))
      .returning({ id: otps.id });
    return consumed.length === 1;
  }

  private async assertRequestAllowed(phone: string): Promise<void> {
    const since = DateTime.now().minus({ seconds: this.requestWindowSeconds }).toJSDate();
    const count = await this.db.$count(otps, and(eq(otps.phone, phone), gte(otps.createdAt, since)));
    if (count >= this.maxRequests) {
      throw new ForbiddenException('Too many OTP requests');
    }
  }

  private generateCode(): string {
    const min = 10 ** (this.length - 1);
    const max = 10 ** this.length;
    return randomInt(min, max).toString();
  }

  private hashCode(code: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('otp.secret')).update(code).digest('hex');
  }

  private codesEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  }

  private get length(): number {
    return this.config.getOrThrow<number>('otp.length');
  }

  private get ttlSeconds(): number {
    return this.config.getOrThrow<number>('otp.ttlSeconds');
  }

  private get maxAttempts(): number {
    return this.config.getOrThrow<number>('otp.maxAttempts');
  }

  private get maxRequests(): number {
    return this.config.getOrThrow<number>('otp.maxRequests');
  }

  private get requestWindowSeconds(): number {
    return this.config.getOrThrow<number>('otp.requestWindowSeconds');
  }
}
