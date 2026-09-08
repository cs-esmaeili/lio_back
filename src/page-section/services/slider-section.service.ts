import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { toFileUrl } from 'src/common/utils/file-url';
import type { SliderSection } from 'src/generated/prisma/client';
import type { UpdateSliderSlideDto } from '../dtos/updateSectionData/update-section-data-request.dto';

export type SliderSlide = {
  id: number;
  desktopFileUrl: string | null;
  tabletFileUrl: string | null;
  mobileFileUrl: string | null;
  url: string | null;
};

export type SliderSectionData = { slides: SliderSlide[] };

type SlideRow = SliderSection & {
  desktopFile: { path: string } | null;
  tabletFile: { path: string } | null;
  mobileFile: { path: string } | null;
};

@Injectable()
export class SliderSectionService {
  private readonly urlPrefix: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.urlPrefix = config.getOrThrow<string>('uploads.urlPrefix');
  }

  async list(sectionId: number): Promise<SliderSectionData> {
    const rows = await this.prisma.sliderSection.findMany({
      where: { sectionId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        desktopFile: { select: { path: true } },
        tabletFile: { select: { path: true } },
        mobileFile: { select: { path: true } },
      },
    });
    return { slides: this.toSlides(rows) };
  }

  /** Update a single slide that belongs to the given section. */
  async update(sectionId: number, slide: UpdateSliderSlideDto): Promise<SliderSectionData> {
    await this.validateFiles(slide);

    const existing = await this.prisma.sliderSection.findFirst({
      where: { id: slide.id, sectionId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Slider slide not found');
    }

    try {
      await this.prisma.sliderSection.update({
        where: { id: slide.id },
        data: {
          desktopFileId: slide.desktopFileId ?? null,
          tabletFileId: slide.tabletFileId ?? null,
          mobileFileId: slide.mobileFileId ?? null,
          url: slide.url ?? null,
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

  private toSlides(rows: SlideRow[]): SliderSlide[] {
    const toUrl = (file: { path: string } | null) => toFileUrl(file?.path ?? null, this.urlPrefix);

    return rows.map((slide) => ({
      id: slide.id,
      desktopFileUrl: toUrl(slide.desktopFile),
      tabletFileUrl: toUrl(slide.tabletFile),
      mobileFileUrl: toUrl(slide.mobileFile),
      url: slide.url,
    }));
  }

  private async validateFiles(slide: UpdateSliderSlideDto) {
    const ids = [slide.desktopFileId, slide.tabletFileId, slide.mobileFileId].filter((id): id is number => typeof id === 'number');

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
