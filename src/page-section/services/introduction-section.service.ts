import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { toFileUrl } from 'src/common/utils/file-url';
import type { IntroductionSection } from 'src/generated/prisma/client';
import type { UpdateIntroductionDto } from '../dtos/updateSectionData/update-section-data-request.dto';

export type IntroductionSectionData = {
  titles: Record<string, string>;
  desktopFileUrl: string | null;
  tabletFileUrl: string | null;
  mobileFileUrl: string | null;
};

type IntroductionRow = IntroductionSection & {
  desktopFile: { path: string } | null;
  tabletFile: { path: string } | null;
  mobileFile: { path: string } | null;
};

@Injectable()
export class IntroductionSectionService {
  private readonly urlPrefix: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.urlPrefix = config.getOrThrow<string>('uploads.urlPrefix');
  }

  async list(sectionId: number): Promise<IntroductionSectionData> {
    const row = await this.prisma.introductionSection.findUnique({
      where: { sectionId },
      include: {
        desktopFile: { select: { path: true } },
        tabletFile: { select: { path: true } },
        mobileFile: { select: { path: true } },
      },
    });

    return row ? this.toData(row) : { titles: {}, desktopFileUrl: null, tabletFileUrl: null, mobileFileUrl: null };
  }

  /** Create or replace the introduction that belongs to the given section. */
  async update(sectionId: number, dto: UpdateIntroductionDto): Promise<IntroductionSectionData> {
    await this.validateFiles(dto);

    const data = {
      titles: dto.titles,
      desktopFileId: dto.desktopFileId,
      tabletFileId: dto.tabletFileId ?? null,
      mobileFileId: dto.mobileFileId ?? null,
    };

    try {
      await this.prisma.introductionSection.upsert({
        where: { sectionId },
        create: { sectionId, ...data },
        update: data,
      });
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException('One or more referenced files no longer exist');
      }
      throw error;
    }

    return this.list(sectionId);
  }

  private toData(row: IntroductionRow): IntroductionSectionData {
    return {
      titles: (row.titles ?? {}) as Record<string, string>,
      desktopFileUrl: toFileUrl(row.desktopFile?.path ?? null, this.urlPrefix),
      tabletFileUrl: toFileUrl(row.tabletFile?.path ?? null, this.urlPrefix),
      mobileFileUrl: toFileUrl(row.mobileFile?.path ?? null, this.urlPrefix),
    };
  }

  private async validateFiles(dto: UpdateIntroductionDto) {
    const ids = [dto.desktopFileId, dto.tabletFileId, dto.mobileFileId].filter((id): id is number => typeof id === 'number');

    if (ids.length === 0) {
      return;
    }

    const count = await this.prisma.file.count({ where: { id: { in: ids } } });
    if (count !== ids.length) {
      throw new BadRequestException('One or more referenced files do not exist');
    }
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2003';
  }
}
