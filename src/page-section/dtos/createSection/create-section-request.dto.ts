import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PageSectionLocation, PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';

export class CreateSectionRequestDto {
  @ApiPropertyOptional({ example: 1, nullable: true, description: 'Owning page id; omit for a global (page-less) section' })
  @IsOptional()
  @IsInt()
  pageId?: number;

  @ApiProperty({ enum: PageSectionType, enumName: 'PageSectionType', example: PageSectionType.SLIDER })
  @IsEnum(PageSectionType)
  type!: PageSectionType;

  @ApiPropertyOptional({
    enum: PageSectionLocation,
    enumName: 'PageSectionLocation',
    example: PageSectionLocation.SLIDER,
    description: 'Render location; defaults to the section type when omitted',
  })
  @IsOptional()
  @IsEnum(PageSectionLocation)
  location?: PageSectionLocation;

  @ApiPropertyOptional({ example: 'محصولات شگفت‌انگیز', nullable: true })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({ example: '/products/sale', nullable: true })
  @IsOptional()
  @IsString()
  link?: string | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ enum: PageSectionStatus, enumName: 'PageSectionStatus', example: PageSectionStatus.ACTIVE })
  @IsOptional()
  @IsEnum(PageSectionStatus)
  status?: PageSectionStatus;
}
