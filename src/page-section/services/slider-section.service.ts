import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { files, sliderSections } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { UpdateSliderSlideDto } from '../dtos/updateSectionData/update-section-data-request.dto';

export type SliderSlide = {
  id: number;
  desktopFileUrl: string | null;
  tabletFileUrl: string | null;
  mobileFileUrl: string | null;
  url: string | null;
};

export type SliderSectionData = { slides: SliderSlide[] };

type SlideRow = typeof sliderSections.$inferSelect & {
  desktopFile: { path: string } | null;
  tabletFile: { path: string } | null;
  mobileFile: { path: string } | null;
};

@Injectable()
export class SliderSectionService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly fileUrl: FileUrlService,
  ) {}

  async list(sectionId: number): Promise<SliderSectionData> {
    const rows = await this.db.query.sliderSections.findMany({
      where: eq(sliderSections.sectionId, sectionId),
      orderBy: [asc(sliderSections.sortOrder), asc(sliderSections.id)],
      with: {
        desktopFile: { columns: { path: true } },
        tabletFile: { columns: { path: true } },
        mobileFile: { columns: { path: true } },
      },
    });
    return { slides: this.toSlides(rows) };
  }

  /** Update a single slide that belongs to the given section. */
  async update(sectionId: number, slide: UpdateSliderSlideDto): Promise<SliderSectionData> {
    await this.validateFiles(slide);

    const existing = await this.db.query.sliderSections.findFirst({
      where: and(eq(sliderSections.id, slide.id), eq(sliderSections.sectionId, sectionId)),
      columns: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Slider slide not found');
    }

    try {
      await this.db
        .update(sliderSections)
        .set({
          desktopFileId: slide.desktopFileId ?? null,
          tabletFileId: slide.tabletFileId ?? null,
          mobileFileId: slide.mobileFileId ?? null,
          url: slide.url ?? null,
        })
        .where(eq(sliderSections.id, slide.id));
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException('One or more referenced files no longer exist');
      }
      throw error;
    }

    return this.list(sectionId);
  }

  private toSlides(rows: SlideRow[]): SliderSlide[] {
    const toUrl = (file: { path: string } | null) => this.fileUrl.toUrl(file?.path ?? null);

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

    const count = await this.db.$count(files, inArray(files.id, ids));
    if (count !== ids.length) {
      throw new BadRequestException('One or more referenced files do not exist');
    }
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23503';
  }
}
