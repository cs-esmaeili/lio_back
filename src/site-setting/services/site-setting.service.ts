import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class SiteSettingService {
  constructor(private readonly prisma: PrismaService) {}

  async getByKey(key: string, authenticated: boolean) {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key } });
    if (!setting || (setting.isPrivate && !authenticated)) {
      // Private settings are hidden from anonymous callers; respond the same as a
      // missing key so their existence is not leaked.
      throw new NotFoundException('Setting not found');
    }
    return { key: setting.key, data: setting.data, isPrivate: setting.isPrivate };
  }

  async upsertByKey(key: string, data: Prisma.InputJsonValue, isPrivate?: boolean) {
    const setting = await this.prisma.siteSetting.upsert({
      where: { key },
      create: { key, data, isPrivate: isPrivate ?? false },
      update: { data, ...(isPrivate === undefined ? {} : { isPrivate }) },
    });
    return { key: setting.key, data: setting.data, isPrivate: setting.isPrivate };
  }
}
