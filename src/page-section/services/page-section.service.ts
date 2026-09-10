import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';
import type { PageSection } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SliderSectionService } from './slider-section.service';
import { ProductListSectionService } from './product-list-section.service';
import { BannerSectionService } from './banner-section.service';
import { IntroductionSectionService } from './introduction-section.service';
import type { SliderSectionData } from './slider-section.service';
import type { ProductListSectionData } from './product-list-section.service';
import type { BannerSectionData } from './banner-section.service';
import type { IntroductionSectionData } from './introduction-section.service';
import type { CreateSectionRequestDto } from '../dtos/createSection/create-section-request.dto';
import type {
  UpdateBannerDto,
  UpdateIntroductionDto,
  UpdatePageSectionDataDto,
  UpdateProductListDto,
  UpdateSliderSlideDto,
} from '../dtos/updateSectionData/update-section-data-request.dto';

@Injectable()
export class PageSectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sliderSectionService: SliderSectionService,
    private readonly productListSectionService: ProductListSectionService,
    private readonly bannerSectionService: BannerSectionService,
    private readonly introductionSectionService: IntroductionSectionService,
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
      case PageSectionType.PRODUCT_LIST:
        return this.toResponse(section, await this.productListSectionService.list(section.id));
      case PageSectionType.BANNER:
        return this.toResponse(section, await this.bannerSectionService.list(section.id));
      case PageSectionType.INTRODUCTION:
        return this.toResponse(section, await this.introductionSectionService.list(section.id));
      default:
        throw new BadRequestException('Unsupported section type');
    }
  }

  async updateSectionData(id: number, dto: UpdatePageSectionDataDto) {
    const section = await this.findSection(id);

    switch (section.type) {
      case PageSectionType.SLIDER:
        return this.toResponse(section, await this.sliderSectionService.update(section.id, dto.data as UpdateSliderSlideDto));
      case PageSectionType.PRODUCT_LIST:
        return this.toResponse(section, await this.productListSectionService.update(section.id, dto.data as UpdateProductListDto));
      case PageSectionType.BANNER:
        return this.toResponse(section, await this.bannerSectionService.update(section.id, dto.data as UpdateBannerDto));
      case PageSectionType.INTRODUCTION:
        return this.toResponse(section, await this.introductionSectionService.update(section.id, dto.data as UpdateIntroductionDto));
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

  private toResponse(section: PageSection, data: SliderSectionData | ProductListSectionData | BannerSectionData | IntroductionSectionData) {
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
