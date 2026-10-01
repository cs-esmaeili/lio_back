import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { PageSectionLocation, PageSectionStatus, PageSectionType, pageSections, pages } from 'src/database/schema';
import { SliderSectionService } from './slider-section.service';
import { ProductListSectionService } from './product-list-section.service';
import { BannerSectionService } from './banner-section.service';
import { IntroductionSectionService } from './introduction-section.service';
import { HeaderSectionService } from './header-section.service';
import { FooterSectionService } from './footer-section.service';
import { ContactSectionService } from './contact-section.service';
import type { SliderSectionData } from './slider-section.service';
import type { ProductListSectionData } from './product-list-section.service';
import type { BannerSectionData } from './banner-section.service';
import type { IntroductionSectionData } from './introduction-section.service';
import type { HeaderSectionData } from './header-section.service';
import type { FooterSectionData } from './footer-section.service';
import type { ContactSectionData } from './contact-section.service';
import type { CreateSectionRequestDto } from '../dtos/createSection/create-section-request.dto';
import type { GetSectionQueryDto } from '../dtos/getSection/get-section-query.dto';
import type { GetPageSectionsQueryDto } from '../dtos/getPageSections/get-page-sections-query.dto';
import type {
  BannerInputDto,
  ContactInputDto,
  DeleteSectionDataQueryDto,
  FooterItemInputDto,
  HeaderItemInputDto,
  IntroductionInputDto,
  PageSectionDataRequestDto,
  ProductListItemInputDto,
  SliderSlideInputDto,
} from '../dtos/sectionData/section-data-request.dto';

type PageSection = typeof pageSections.$inferSelect;
type Page = typeof pages.$inferSelect;

const DEFAULT_LOCATION: Record<PageSectionType, PageSectionLocation> = {
  [PageSectionType.SLIDER]: PageSectionLocation.SLIDER,
  [PageSectionType.PRODUCT_LIST]: PageSectionLocation.PRODUCT_LIST,
  [PageSectionType.BANNER]: PageSectionLocation.BANNER,
  [PageSectionType.INTRODUCTION]: PageSectionLocation.INTRODUCTION,
  [PageSectionType.HEADER]: PageSectionLocation.HEADER,
  [PageSectionType.FOOTER]: PageSectionLocation.FOOTER,
  [PageSectionType.CONTACT]: PageSectionLocation.CONTACT,
};

@Injectable()
export class PageSectionService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly sliderSectionService: SliderSectionService,
    private readonly productListSectionService: ProductListSectionService,
    private readonly bannerSectionService: BannerSectionService,
    private readonly introductionSectionService: IntroductionSectionService,
    private readonly headerSectionService: HeaderSectionService,
    private readonly footerSectionService: FooterSectionService,
    private readonly contactSectionService: ContactSectionService,
  ) {}

  async createSection(dto: CreateSectionRequestDto) {
    if (dto.pageId !== undefined) {
      const page = await this.db.query.pages.findFirst({ where: eq(pages.id, dto.pageId), columns: { id: true } });
      if (!page) {
        throw new BadRequestException('Page not found');
      }
    }

    const [section] = await this.db
      .insert(pageSections)
      .values({
        pageId: dto.pageId ?? null,
        type: dto.type,
        location: dto.location ?? DEFAULT_LOCATION[dto.type],
        title: dto.title ?? null,
        link: dto.link ?? null,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? PageSectionStatus.ACTIVE,
      })
      .returning();

    return this.getSection({ id: section.id });
  }

  async getSection(query: GetSectionQueryDto) {
    const section = query.id !== undefined ? await this.findSection(query.id) : await this.findSectionByLocation(query.location);

    return this.toResponse(section, await this.getSectionData(section));
  }

  async getPageSections(query: GetPageSectionsQueryDto) {
    const page = await this.findPageByEntity(query);

    const sections = await this.db.query.pageSections.findMany({
      where: and(eq(pageSections.pageId, page.id), eq(pageSections.status, PageSectionStatus.ACTIVE)),
      orderBy: [asc(pageSections.sortOrder), asc(pageSections.id)],
    });

    const data = await Promise.all(sections.map(async (section) => this.toResponse(section, await this.getSectionData(section))));

    return {
      page: { id: page.id, entityType: page.entityType, entityId: page.entityId, slug: page.slug },
      sections: data,
    };
  }

  async createSectionData(id: number, dto: PageSectionDataRequestDto) {
    const section = await this.findSection(id);
    return this.toResponse(section, await this.createSectionItem(section, dto));
  }

  async updateSectionData(id: number, dto: PageSectionDataRequestDto) {
    const section = await this.findSection(id);
    return this.toResponse(section, await this.updateSectionItem(section, dto));
  }

  async deleteSectionData(id: number, query: DeleteSectionDataQueryDto) {
    const section = await this.findSection(id);
    return this.toResponse(section, await this.removeSectionItem(section, query));
  }

  // --------------------------------------------------------
  //  Per-item dispatch — same shape for every section type
  // --------------------------------------------------------

  private createSectionItem(section: PageSection, dto: PageSectionDataRequestDto) {
    switch (section.type) {
      case PageSectionType.SLIDER:
        return this.sliderSectionService.create(section.id, dto.data as SliderSlideInputDto);
      case PageSectionType.PRODUCT_LIST:
        return this.productListSectionService.create(section.id, dto.data as ProductListItemInputDto);
      case PageSectionType.BANNER:
        return this.bannerSectionService.create(section.id, dto.data as BannerInputDto);
      case PageSectionType.INTRODUCTION:
        return this.introductionSectionService.create(section.id, dto.data as IntroductionInputDto);
      case PageSectionType.HEADER:
        return this.headerSectionService.create(section.id, dto.data as HeaderItemInputDto);
      case PageSectionType.FOOTER:
        return this.footerSectionService.create(section.id, dto.data as FooterItemInputDto);
      case PageSectionType.CONTACT:
        return this.contactSectionService.create(section.id, dto.data as ContactInputDto);
      default:
        throw new BadRequestException('Unsupported section type');
    }
  }

  private updateSectionItem(section: PageSection, dto: PageSectionDataRequestDto) {
    switch (section.type) {
      case PageSectionType.SLIDER:
        return this.sliderSectionService.update(section.id, dto.data as SliderSlideInputDto);
      case PageSectionType.PRODUCT_LIST:
        return this.productListSectionService.update(section.id, dto.data as ProductListItemInputDto);
      case PageSectionType.BANNER:
        return this.bannerSectionService.update(section.id, dto.data as BannerInputDto);
      case PageSectionType.INTRODUCTION:
        return this.introductionSectionService.update(section.id, dto.data as IntroductionInputDto);
      case PageSectionType.HEADER:
        return this.headerSectionService.update(section.id, dto.data as HeaderItemInputDto);
      case PageSectionType.FOOTER:
        return this.footerSectionService.update(section.id, dto.data as FooterItemInputDto);
      case PageSectionType.CONTACT:
        return this.contactSectionService.update(section.id, dto.data as ContactInputDto);
      default:
        throw new BadRequestException('Unsupported section type');
    }
  }

  private removeSectionItem(section: PageSection, query: DeleteSectionDataQueryDto) {
    switch (section.type) {
      case PageSectionType.SLIDER:
        return this.sliderSectionService.remove(section.id, this.requireItemId(query));
      case PageSectionType.PRODUCT_LIST:
        return this.productListSectionService.remove(section.id, this.requireItemId(query));
      case PageSectionType.BANNER:
        return this.bannerSectionService.remove(section.id, this.requireItemId(query));
      case PageSectionType.INTRODUCTION:
        return this.introductionSectionService.remove(section.id);
      case PageSectionType.HEADER:
        return this.headerSectionService.remove(section.id, this.requireItemId(query));
      case PageSectionType.FOOTER:
        return this.footerSectionService.remove(section.id, this.requireItemId(query));
      case PageSectionType.CONTACT:
        return this.contactSectionService.remove(section.id);
      default:
        throw new BadRequestException('Unsupported section type');
    }
  }

  private requireItemId(query: DeleteSectionDataQueryDto): number {
    if (query.itemId === undefined) {
      throw new BadRequestException('itemId is required for this section type');
    }
    return query.itemId;
  }

  private async findSection(id: number): Promise<PageSection> {
    const section = await this.db.query.pageSections.findFirst({ where: eq(pageSections.id, id) });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    return section;
  }

  private async findSectionByLocation(location?: PageSectionLocation): Promise<PageSection> {
    if (location === undefined) {
      throw new BadRequestException('Provide either id or location');
    }

    const section = await this.db.query.pageSections.findFirst({ where: eq(pageSections.location, location), orderBy: asc(pageSections.id) });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    return section;
  }

  private async findPageByEntity(query: GetPageSectionsQueryDto): Promise<Page> {
    const entityId = query.entityId ?? null;
    const page = await this.db.query.pages.findFirst({
      where: and(eq(pages.entityType, query.entityType), entityId === null ? isNull(pages.entityId) : eq(pages.entityId, entityId)),
    });
    if (!page) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }

  private getSectionData(section: PageSection) {
    switch (section.type) {
      case PageSectionType.SLIDER:
        return this.sliderSectionService.list(section.id);
      case PageSectionType.PRODUCT_LIST:
        return this.productListSectionService.list(section.id);
      case PageSectionType.BANNER:
        return this.bannerSectionService.list(section.id);
      case PageSectionType.INTRODUCTION:
        return this.introductionSectionService.list(section.id);
      case PageSectionType.HEADER:
        return this.headerSectionService.list(section.id);
      case PageSectionType.FOOTER:
        return this.footerSectionService.list(section.id);
      case PageSectionType.CONTACT:
        return this.contactSectionService.list(section.id);
      default:
        throw new BadRequestException('Unsupported section type');
    }
  }

  private toResponse(
    section: PageSection,
    data: SliderSectionData | ProductListSectionData | BannerSectionData | IntroductionSectionData | HeaderSectionData | FooterSectionData | ContactSectionData,
  ) {
    return {
      id: section.id,
      pageId: section.pageId,
      type: section.type,
      location: section.location,
      title: section.title,
      link: section.link,
      sortOrder: section.sortOrder,
      status: section.status,
      data,
    };
  }
}
