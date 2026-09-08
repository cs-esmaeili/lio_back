import { ApiProperty } from '@nestjs/swagger';
import { PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';

export class SliderSectionDataDto {
  @ApiProperty({ example: null, nullable: true })
  desktopFileId!: number | null;

  @ApiProperty({ example: null, nullable: true })
  tabletFileId!: number | null;

  @ApiProperty({ example: null, nullable: true })
  mobileFileId!: number | null;
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
