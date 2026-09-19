import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { bannerSections, files } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { UpdateBannerDto } from '../dtos/updateSectionData/update-section-data-request.dto';

export type BannerItem = {
  id: number;
  sortOrder: number;
  title: string;
  subtitle: string | null;
  buttonTitle: string | null;
  buttonUrl: string | null;
  desktopFileUrl: string | null;
  tabletFileUrl: string | null;
  mobileFileUrl: string | null;
};

export type BannerSectionData = { banners: BannerItem[] };

type BannerRow = typeof bannerSections.$inferSelect & {
  desktopFile: { path: string } | null;
  tabletFile: { path: string } | null;
  mobileFile: { path: string } | null;
};

@Injectable()
export class BannerSectionService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly fileUrl: FileUrlService,
  ) {}

  async list(sectionId: number): Promise<BannerSectionData> {
    const rows = await this.db.query.bannerSections.findMany({
      where: eq(bannerSections.sectionId, sectionId),
      orderBy: [asc(bannerSections.sortOrder), asc(bannerSections.id)],
      with: {
        desktopFile: { columns: { path: true } },
        tabletFile: { columns: { path: true } },
        mobileFile: { columns: { path: true } },
      },
    });
    return { banners: this.toBanners(rows) };
  }

  /** Update a single banner that belongs to the given section. */
  async update(sectionId: number, banner: UpdateBannerDto): Promise<BannerSectionData> {
    await this.validateFiles(banner);

    const existing = await this.db.query.bannerSections.findFirst({
      where: and(eq(bannerSections.id, banner.id), eq(bannerSections.sectionId, sectionId)),
      columns: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Banner not found');
    }

    try {
      await this.db
        .update(bannerSections)
        .set({
          title: banner.title,
          subtitle: banner.subtitle ?? null,
          buttonTitle: banner.buttonTitle ?? null,
          buttonUrl: banner.buttonUrl ?? null,
          desktopFileId: banner.desktopFileId,
          tabletFileId: banner.tabletFileId,
          mobileFileId: banner.mobileFileId,
        })
        .where(eq(bannerSections.id, banner.id));
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException('One or more referenced files no longer exist');
      }
      throw error;
    }

    return this.list(sectionId);
  }

  private toBanners(rows: BannerRow[]): BannerItem[] {
    const toUrl = (file: { path: string } | null) => this.fileUrl.toUrl(file?.path ?? null);

    return rows.map((banner) => ({
      id: banner.id,
      sortOrder: banner.sortOrder,
      title: banner.title,
      subtitle: banner.subtitle,
      buttonTitle: banner.buttonTitle,
      buttonUrl: banner.buttonUrl,
      desktopFileUrl: toUrl(banner.desktopFile),
      tabletFileUrl: toUrl(banner.tabletFile),
      mobileFileUrl: toUrl(banner.mobileFile),
    }));
  }

  private async validateFiles(banner: UpdateBannerDto) {
    const ids = [banner.desktopFileId, banner.tabletFileId, banner.mobileFileId].filter((id): id is number => typeof id === 'number');

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
