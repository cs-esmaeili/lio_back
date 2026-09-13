import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PageSectionLocation, PageSectionStatus, PageSectionType } from 'src/generated/prisma/client';

export class CreateSectionRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  pageId!: number;

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
