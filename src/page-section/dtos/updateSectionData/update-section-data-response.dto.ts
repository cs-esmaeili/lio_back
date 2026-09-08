import { ApiProperty } from '@nestjs/swagger';
import { PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';

export class SliderSectionDataDto {
  @ApiProperty({ example: 101, nullable: true })
  desktopFileId!: number | null;

  @ApiProperty({ example: 102, nullable: true })
  tabletFileId!: number | null;

  @ApiProperty({ example: 103, nullable: true })
  mobileFileId!: number | null;
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
