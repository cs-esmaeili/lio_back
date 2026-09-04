import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HomeSectionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'slider' })
  type!: string;

  @ApiPropertyOptional({ example: 'Slider', nullable: true })
  title!: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, nullable: true })
  data?: unknown;
}

export class GetHomeResponseDto {
  @ApiProperty({ example: 'home' })
  slug!: string;

  @ApiProperty({ type: HomeSectionDto, isArray: true })
  sections!: HomeSectionDto[];
}
