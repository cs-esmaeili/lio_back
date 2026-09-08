import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, IsNotEmptyObject, IsOptional, ValidateNested } from 'class-validator';
import { PageSectionType } from 'src/generated/prisma/client';

export class UpdateSliderSectionDto {
  @ApiPropertyOptional({ example: 101, nullable: true })
  @IsOptional()
  @IsInt()
  desktopFileId?: number | null;

  @ApiPropertyOptional({ example: 102, nullable: true })
  @IsOptional()
  @IsInt()
  tabletFileId?: number | null;

  @ApiPropertyOptional({ example: 103, nullable: true })
  @IsOptional()
  @IsInt()
  mobileFileId?: number | null;
}

export class UpdatePageSectionDataDto {
  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  @IsEnum(PageSectionType)
  type!: PageSectionType;

  @ApiProperty({ type: UpdateSliderSectionDto })
  @IsDefined()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => UpdateSliderSectionDto)
  data!: UpdateSliderSectionDto;
}
