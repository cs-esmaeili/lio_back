import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class SiteSettingService {
  constructor(private readonly prisma: PrismaService) {}

  async getByKey(key: string) {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key } });
    if (!setting) {
      throw new NotFoundException('Setting not found');
    }
    return { key: setting.key, data: setting.data };
  }

  async upsertByKey(key: string, data: Prisma.InputJsonValue) {
    const setting = await this.prisma.siteSetting.upsert({
      where: { key },
      create: { key, data },
      update: { data },
    });
    return { key: setting.key, data: setting.data };
  }
}
