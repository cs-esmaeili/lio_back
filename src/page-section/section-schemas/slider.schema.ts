import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export interface SliderImageData {
  fileId: number;
  alt: string | null;
}

export interface SliderSlideData {
  id: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
  images: {
    desktop: SliderImageData;
    tablet: SliderImageData | null;
    mobile: SliderImageData | null;
  };
}

export class SliderImageDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  fileId!: number;

  @ApiPropertyOptional({ example: 'Desktop banner', nullable: true })
  @IsOptional()
  @IsString()
  alt?: string | null;
}

export class SlideImagesDto {
  @ApiProperty({ type: SliderImageDto })
  @ValidateNested()
  @Type(() => SliderImageDto)
  desktop!: SliderImageDto;

  @ApiPropertyOptional({ type: SliderImageDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => SliderImageDto)
  tablet?: SliderImageDto;

  @ApiPropertyOptional({ type: SliderImageDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => SliderImageDto)
  mobile?: SliderImageDto;
}

export class SliderSlideDto {
  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  @IsString()
  id!: string;

  @ApiPropertyOptional({ example: 'Summer sale', nullable: true })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({ example: 'Up to 50% off', nullable: true })
  @IsOptional()
  @IsString()
  subtitle?: string | null;

  @ApiPropertyOptional({ example: '/products', nullable: true })
  @IsOptional()
  @IsString()
  link?: string | null;

  @ApiProperty({ example: 0 })
  @IsInt()
  sortOrder!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({ type: SlideImagesDto })
  @ValidateNested()
  @Type(() => SlideImagesDto)
  images!: SlideImagesDto;
}

export class SliderDataDto {
  @ApiProperty({ type: SliderSlideDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SliderSlideDto)
  slides!: SliderSlideDto[];
}

export function mapSliderData(data: unknown): Record<string, unknown> {
  const raw = (data ?? {}) as { slides?: unknown[] };
  const slides = (Array.isArray(raw.slides) ? raw.slides : []) as SliderSlideData[];
  return { slides: [...slides].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) };
}
