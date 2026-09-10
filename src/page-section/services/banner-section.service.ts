import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { toFileUrl } from 'src/common/utils/file-url';
import type { BannerSection } from 'src/generated/prisma/client';
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

type BannerRow = BannerSection & {
  desktopFile: { path: string } | null;
  tabletFile: { path: string } | null;
  mobileFile: { path: string } | null;
};

@Injectable()
export class BannerSectionService {
  private readonly urlPrefix: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.urlPrefix = config.getOrThrow<string>('uploads.urlPrefix');
  }

  async list(sectionId: number): Promise<BannerSectionData> {
    const rows = await this.prisma.bannerSection.findMany({
      where: { sectionId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        desktopFile: { select: { path: true } },
        tabletFile: { select: { path: true } },
        mobileFile: { select: { path: true } },
      },
    });
    return { banners: this.toBanners(rows) };
  }

  /** Update a single banner that belongs to the given section. */
  async update(sectionId: number, banner: UpdateBannerDto): Promise<BannerSectionData> {
    await this.validateFiles(banner);

    const existing = await this.prisma.bannerSection.findFirst({
      where: { id: banner.id, sectionId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Banner not found');
    }

    try {
      await this.prisma.bannerSection.update({
        where: { id: banner.id },
        data: {
          title: banner.title,
          subtitle: banner.subtitle ?? null,
          buttonTitle: banner.buttonTitle ?? null,
          buttonUrl: banner.buttonUrl ?? null,
          desktopFileId: banner.desktopFileId,
          tabletFileId: banner.tabletFileId,
          mobileFileId: banner.mobileFileId,
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

  private toBanners(rows: BannerRow[]): BannerItem[] {
    const toUrl = (file: { path: string } | null) => toFileUrl(file?.path ?? null, this.urlPrefix);

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

    const count = await this.prisma.file.count({ where: { id: { in: ids } } });
    if (count !== ids.length) {
      throw new BadRequestException('One or more referenced files do not exist');
    }
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2003';
  }
}
