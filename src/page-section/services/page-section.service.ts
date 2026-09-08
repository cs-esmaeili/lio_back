import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';
import type { PageSection } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SliderSectionService } from './slider-section.service';
import type { SliderSectionData } from './slider-section.service';
import type { CreateSectionRequestDto } from '../dtos/createSection/create-section-request.dto';
import type { UpdatePageSectionDataDto } from '../dtos/updateSectionData/update-section-data-request.dto';

@Injectable()
export class PageSectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sliderSectionService: SliderSectionService,
  ) {}

  async createSection(dto: CreateSectionRequestDto) {
    const section = await this.prisma.pageSection.create({
      data: {
        pageId: dto.pageId,
        type: dto.type,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? PageSectionStatus.ACTIVE,
      },
    });

    return this.getSection(section.id);
  }

  async getSection(id: number) {
    const section = await this.findSection(id);

    switch (section.type) {
      case PageSectionType.SLIDER:
        return this.toResponse(section, await this.sliderSectionService.list(section.id));
      default:
        throw new BadRequestException('Unsupported section type');
    }
  }

  async updateSectionData(id: number, dto: UpdatePageSectionDataDto) {
    const section = await this.findSection(id);

    switch (section.type) {
      case PageSectionType.SLIDER:
        return this.toResponse(section, await this.sliderSectionService.update(section.id, dto.data));
      default:
        throw new BadRequestException('Unsupported section type');
    }
  }

  private async findSection(id: number): Promise<PageSection> {
    const section = await this.prisma.pageSection.findUnique({ where: { id } });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    return section;
  }

  private toResponse(section: PageSection, data: SliderSectionData) {
    return {
      id: section.id,
      pageId: section.pageId,
      type: section.type,
      sortOrder: section.sortOrder,
      status: section.status,
      data,
    };
  }
}
