import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { aboutSections, files } from 'src/database/schema';
import type { AboutStatisticRecord } from 'src/database/schema/about-section';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { AboutInputDto, AboutStatisticInputDto } from '../dtos/sectionData/section-data-request.dto';

export type AboutStatistic = {
  id: number;
  title: string;
  description: string;
  number: number;
};

export type AboutSectionData = {
  headerTitle: string | null;
  headerDescription: string | null;
  headerFileId: number | null;
  headerFileUrl: string | null;
  historyTitle: string | null;
  historyDescription: string | null;
  founderTitle: string | null;
  founderSubtitle: string | null;
  founderDescription: string | null;
  founderFileId: number | null;
  founderFileUrl: string | null;
  founderSignatureFileId: number | null;
  founderSignatureFileUrl: string | null;
  statistics: AboutStatistic[];
};

type AboutRow = typeof aboutSections.$inferSelect & {
  headerFile: { path: string } | null;
  founderFile: { path: string } | null;
  founderSignatureFile: { path: string } | null;
};

const EMPTY: AboutSectionData = {
  headerTitle: null,
  headerDescription: null,
  headerFileId: null,
  headerFileUrl: null,
  historyTitle: null,
  historyDescription: null,
  founderTitle: null,
  founderSubtitle: null,
  founderDescription: null,
  founderFileId: null,
  founderFileUrl: null,
  founderSignatureFileId: null,
  founderSignatureFileUrl: null,
  statistics: [],
};

@Injectable()
export class AboutSectionService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly fileUrl: FileUrlService,
  ) {}

  async list(sectionId: number): Promise<AboutSectionData> {
    const row = await this.db.query.aboutSections.findFirst({
      where: eq(aboutSections.sectionId, sectionId),
      with: {
        headerFile: { columns: { path: true } },
        founderFile: { columns: { path: true } },
        founderSignatureFile: { columns: { path: true } },
      },
    });

    return row ? this.toData(row) : { ...EMPTY };
  }

  /** Create the about record (upsert) for the given section. */
  create(sectionId: number, dto: AboutInputDto): Promise<AboutSectionData> {
    return this.update(sectionId, dto);
  }

  /** Delete the about record of the given section. */
  async remove(sectionId: number): Promise<AboutSectionData> {
    const deleted = await this.db.delete(aboutSections).where(eq(aboutSections.sectionId, sectionId)).returning({ id: aboutSections.id });

    if (deleted.length === 0) {
      throw new NotFoundException('About not found');
    }

    return this.list(sectionId);
  }

  /** Create or replace the about data that belongs to the given section. */
  async update(sectionId: number, dto: AboutInputDto): Promise<AboutSectionData> {
    await this.validateFiles(dto);

    const values = {
      sectionId,
      headerTitle: dto.headerTitle ?? null,
      headerDescription: dto.headerDescription ?? null,
      headerFileId: dto.headerFileId ?? null,
      historyTitle: dto.historyTitle ?? null,
      historyDescription: dto.historyDescription ?? null,
      founderTitle: dto.founderTitle ?? null,
      founderSubtitle: dto.founderSubtitle ?? null,
      founderDescription: dto.founderDescription ?? null,
      founderFileId: dto.founderFileId ?? null,
      founderSignatureFileId: dto.founderSignatureFileId ?? null,
      statistics: this.normalizeStatistics(dto.statistics),
    };

    try {
      await this.db
        .insert(aboutSections)
        .values(values)
        .onConflictDoUpdate({
          target: aboutSections.sectionId,
          set: {
            headerTitle: values.headerTitle,
            headerDescription: values.headerDescription,
            headerFileId: values.headerFileId,
            historyTitle: values.historyTitle,
            historyDescription: values.historyDescription,
            founderTitle: values.founderTitle,
            founderSubtitle: values.founderSubtitle,
            founderDescription: values.founderDescription,
            founderFileId: values.founderFileId,
            founderSignatureFileId: values.founderSignatureFileId,
            statistics: values.statistics,
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

  private toData(row: AboutRow): AboutSectionData {
    return {
      headerTitle: row.headerTitle,
      headerDescription: row.headerDescription,
      headerFileId: row.headerFileId,
      headerFileUrl: this.fileUrl.toUrl(row.headerFile?.path ?? null),
      historyTitle: row.historyTitle,
      historyDescription: row.historyDescription,
      founderTitle: row.founderTitle,
      founderSubtitle: row.founderSubtitle,
      founderDescription: row.founderDescription,
      founderFileId: row.founderFileId,
      founderFileUrl: this.fileUrl.toUrl(row.founderFile?.path ?? null),
      founderSignatureFileId: row.founderSignatureFileId,
      founderSignatureFileUrl: this.fileUrl.toUrl(row.founderSignatureFile?.path ?? null),
      statistics: (row.statistics ?? []).map((stat, index) => ({
        id: index + 1,
        title: stat.title,
        description: stat.description,
        number: stat.number,
      })),
    };
  }

  private normalizeStatistics(items?: AboutStatisticInputDto[]): AboutStatisticRecord[] {
    if (!items || items.length === 0) return [];

    return items.map((item) => ({
      title: (item.title ?? '').trim(),
      description: (item.description ?? '').trim(),
      number: item.number ?? 0,
    }));
  }

  private async validateFiles(dto: AboutInputDto): Promise<void> {
    const ids = [...new Set([dto.headerFileId, dto.founderFileId, dto.founderSignatureFileId].filter((id): id is number => typeof id === 'number'))];
    if (ids.length === 0) return;

    const count = await this.db.$count(files, inArray(files.id, ids));
    if (count !== ids.length) {
      throw new BadRequestException('One or more referenced files do not exist');
    }
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23503';
  }
}
