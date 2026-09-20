import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { files, introductionSections } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { UpdateIntroductionDto } from '../dtos/updateSectionData/update-section-data-request.dto';

export type IntroductionSectionData = {
  titles: Record<string, string>;
  desktopFileUrl: string | null;
  tabletFileUrl: string | null;
  mobileFileUrl: string | null;
};

type IntroductionRow = typeof introductionSections.$inferSelect & {
  desktopFile: { path: string } | null;
  tabletFile: { path: string } | null;
  mobileFile: { path: string } | null;
};

@Injectable()
export class IntroductionSectionService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly fileUrl: FileUrlService,
  ) {}

  async list(sectionId: number): Promise<IntroductionSectionData> {
    const row = await this.db.query.introductionSections.findFirst({
      where: eq(introductionSections.sectionId, sectionId),
      with: {
        desktopFile: { columns: { path: true } },
        tabletFile: { columns: { path: true } },
        mobileFile: { columns: { path: true } },
      },
    });

    return row ? this.toData(row) : { titles: {}, desktopFileUrl: null, tabletFileUrl: null, mobileFileUrl: null };
  }

  /** Create or replace the introduction that belongs to the given section. */
  async update(sectionId: number, dto: UpdateIntroductionDto): Promise<IntroductionSectionData> {
    await this.validateFiles(dto);

    const values = {
      sectionId,
      titles: dto.titles as Record<string, unknown>,
      desktopFileId: dto.desktopFileId,
      tabletFileId: dto.tabletFileId ?? null,
      mobileFileId: dto.mobileFileId ?? null,
    };

    try {
      await this.db
        .insert(introductionSections)
        .values(values)
        .onConflictDoUpdate({
          target: introductionSections.sectionId,
          set: {
            titles: values.titles,
            desktopFileId: values.desktopFileId,
            tabletFileId: values.tabletFileId,
            mobileFileId: values.mobileFileId,
          },
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

    const count = await this.db.$count(files, inArray(files.id, ids));
    if (count !== ids.length) {
      throw new BadRequestException('One or more referenced files do not exist');
    }
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23503';
  }
}
