import { ApiProperty } from '@nestjs/swagger';
import { PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';

export class SliderSlideDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ example: null, nullable: true })
  desktopFileUrl!: string | null;

  @ApiProperty({ example: null, nullable: true })
  tabletFileUrl!: string | null;

  @ApiProperty({ example: null, nullable: true })
  mobileFileUrl!: string | null;

  @ApiProperty({ example: null, nullable: true })
  url!: string | null;
}

export class SliderSectionDataDto {
  @ApiProperty({ type: SliderSlideDto, isArray: true })
  slides!: SliderSlideDto[];
}

export class CreateSectionResponseDto {
  @ApiProperty({ example: 50 })
  id!: number;

  @ApiProperty({ example: 1 })
  pageId!: number;

  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  type!: PageSectionType;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ enum: PageSectionStatus, enumName: 'PageSectionStatus', example: PageSectionStatus.ACTIVE })
  status!: PageSectionStatus;

  @ApiProperty({ type: SliderSectionDataDto })
  data!: SliderSectionDataDto;
}
