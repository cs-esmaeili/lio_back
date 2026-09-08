import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';

export class CreateSectionRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  pageId!: number;

  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  @IsEnum(PageSectionType)
  type!: PageSectionType;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ enum: PageSectionStatus, enumName: 'PageSectionStatus', example: PageSectionStatus.ACTIVE })
  @IsOptional()
  @IsEnum(PageSectionStatus)
  status?: PageSectionStatus;
}
