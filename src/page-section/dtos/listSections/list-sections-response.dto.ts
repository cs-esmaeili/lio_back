import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListSectionsResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  pageId!: number;

  @ApiProperty({ example: 'slider' })
  type!: string;

  @ApiPropertyOptional({ example: 'Slider', nullable: true })
  title!: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, nullable: true })
  data!: unknown;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-09-04T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-09-04T12:00:00.000Z' })
  updatedAt!: Date;
}
