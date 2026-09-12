import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUrlService } from 'src/common/services/file-url.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUrl: FileUrlService,
  ) {}

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
      desktopFileUrl: this.fileUrl.toUrl(row.desktopFile?.path ?? null),
      tabletFileUrl: this.fileUrl.toUrl(row.tabletFile?.path ?? null),
      mobileFileUrl: this.fileUrl.toUrl(row.mobileFile?.path ?? null),
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
