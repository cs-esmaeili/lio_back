import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { files, sliderSections } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { SliderSlideInputDto } from '../dtos/sectionData/section-data-request.dto';

export type SliderSlide = {
  id: number;
  desktopFileId: number;
  tabletFileId: number;
  mobileFileId: number;
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

  /** Append a new slide to the given section. */
  async create(sectionId: number, slide: SliderSlideInputDto): Promise<SliderSectionData> {
    await this.validateFiles(slide);

    try {
      await this.db.insert(sliderSections).values({
        sectionId,
        sortOrder: slide.sortOrder ?? (await this.nextSortOrder(sectionId)),
        desktopFileId: slide.desktopFileId,
        tabletFileId: slide.tabletFileId,
        mobileFileId: slide.mobileFileId,
        url: slide.url ?? null,
      });
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException('One or more referenced files no longer exist');
      }
      throw error;
    }

    return this.list(sectionId);
  }

  /** Update a single slide that belongs to the given section. */
  async update(sectionId: number, slide: SliderSlideInputDto): Promise<SliderSectionData> {
    const id = this.requireId(slide.id);
    await this.validateFiles(slide);
    await this.ensureExists(sectionId, id);

    try {
      await this.db
        .update(sliderSections)
        .set({
          desktopFileId: slide.desktopFileId,
          tabletFileId: slide.tabletFileId,
          mobileFileId: slide.mobileFileId,
          url: slide.url ?? null,
          ...(slide.sortOrder === undefined ? {} : { sortOrder: slide.sortOrder }),
        })
        .where(eq(sliderSections.id, id));
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException('One or more referenced files no longer exist');
      }
      throw error;
    }

    return this.list(sectionId);
  }

  /** Delete a single slide that belongs to the given section. */
  async remove(sectionId: number, id: number): Promise<SliderSectionData> {
    const deleted = await this.db
      .delete(sliderSections)
      .where(and(eq(sliderSections.id, id), eq(sliderSections.sectionId, sectionId)))
      .returning({ id: sliderSections.id });

    if (deleted.length === 0) {
      throw new NotFoundException('Slider slide not found');
    }

    return this.list(sectionId);
  }

  private requireId(id?: number): number {
    if (id === undefined) {
      throw new BadRequestException('id is required when updating an item');
    }
    return id;
  }

  private async ensureExists(sectionId: number, id: number): Promise<void> {
    const existing = await this.db.query.sliderSections.findFirst({
      where: and(eq(sliderSections.id, id), eq(sliderSections.sectionId, sectionId)),
      columns: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Slider slide not found');
    }
  }

  private async nextSortOrder(sectionId: number): Promise<number> {
    const last = await this.db.query.sliderSections.findFirst({
      where: eq(sliderSections.sectionId, sectionId),
      columns: { sortOrder: true },
      orderBy: desc(sliderSections.sortOrder),
    });
    return (last?.sortOrder ?? -1) + 1;
  }

  private toSlides(rows: SlideRow[]): SliderSlide[] {
    const toUrl = (file: { path: string } | null) => this.fileUrl.toUrl(file?.path ?? null);

    return rows.map((slide) => ({
      id: slide.id,
      desktopFileId: slide.desktopFileId,
      tabletFileId: slide.tabletFileId,
      mobileFileId: slide.mobileFileId,
      desktopFileUrl: toUrl(slide.desktopFile),
      tabletFileUrl: toUrl(slide.tabletFile),
      mobileFileUrl: toUrl(slide.mobileFile),
      url: slide.url,
    }));
  }

  private async validateFiles(slide: SliderSlideInputDto) {
    const ids = [...new Set([slide.desktopFileId, slide.tabletFileId, slide.mobileFileId].filter((id): id is number => typeof id === 'number'))];

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
