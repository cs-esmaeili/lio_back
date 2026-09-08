import { ApiProperty } from '@nestjs/swagger';
import { PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';

export class SliderSlideDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ example: '/uploads/images/hero-desktop.png', nullable: true })
  desktopFileUrl!: string | null;

  @ApiProperty({ example: '/uploads/images/hero-tablet.png', nullable: true })
  tabletFileUrl!: string | null;

  @ApiProperty({ example: '/uploads/images/hero-mobile.png', nullable: true })
  mobileFileUrl!: string | null;

  @ApiProperty({ example: '/products/sale', nullable: true })
  url!: string | null;
}

export class SliderSectionDataDto {
  @ApiProperty({ type: SliderSlideDto, isArray: true })
  slides!: SliderSlideDto[];
}

export class UpdateSectionDataResponseDto {
  @ApiProperty({ example: 50 })
  id!: number;

  @ApiProperty({ example: 1 })
  pageId!: number;

  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  type!: PageSectionType;

  @ApiProperty({ example: 1 })
  sortOrder!: number;

  @ApiProperty({ enum: PageSectionStatus, enumName: 'PageSectionStatus', example: PageSectionStatus.ACTIVE })
  status!: PageSectionStatus;

  @ApiProperty({ type: SliderSectionDataDto })
  data!: SliderSectionDataDto;
}
