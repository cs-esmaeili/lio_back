import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OtpPurpose } from 'src/generated/prisma/client';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async request(phone: string, purpose: OtpPurpose): Promise<string> {
    await this.assertRequestAllowed(phone);

    // single active OTP per phone+purpose: invalidate previous unused ones
    await this.prisma.otp.updateMany({
      where: { phone, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    const code = this.generateCode();
    await this.prisma.otp.create({
      data: {
        phone,
        purpose,
        codeHash: this.hashCode(code),
        expiresAt: new Date(Date.now() + this.ttlSeconds * 1000),
      },
    });

    return code;
  }

  async verify(
    phone: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<boolean> {
    const otp = await this.prisma.otp.findFirst({
      where: { phone, purpose, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) return false;

    if (otp.attempts >= this.maxAttempts) {
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      });
      return false;
    }

    if (!this.codesEqual(otp.codeHash, this.hashCode(code))) {
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }

    // atomic single-use consume (guards against concurrent replay)
    const consumed = await this.prisma.otp.updateMany({
      where: { id: otp.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return consumed.count === 1;
  }

  private async assertRequestAllowed(phone: string): Promise<void> {
    const since = new Date(Date.now() - this.requestWindowSeconds * 1000);
    const count = await this.prisma.otp.count({
      where: { phone, createdAt: { gte: since } },
    });
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
    return createHmac('sha256', this.config.getOrThrow<string>('otp.secret'))
      .update(code)
      .digest('hex');
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
