import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EntryDto {
  @ApiProperty({ enum: ['folder', 'file'], example: 'file' })
  type!: 'folder' | 'file';

  @ApiProperty({ example: 'photo.png' })
  name!: string;

  @ApiProperty({ example: 'images/photo-abc123.png' })
  path!: string;

  @ApiPropertyOptional({ example: 1 })
  id?: number;

  @ApiPropertyOptional({ example: 2048 })
  size?: number;

  @ApiPropertyOptional({ example: 'image/png' })
  mimeType?: string;

  @ApiPropertyOptional({ example: '/uploads/images/photo-abc123.png' })
  url?: string;

  @ApiPropertyOptional({ example: '2026-09-02T12:00:00.000Z' })
  createdAt?: string;
}

export class ListFilesResponseDto {
  @ApiProperty({ example: 'images' })
  path!: string;

  @ApiProperty({ type: EntryDto, isArray: true })
  entries!: EntryDto[];
}
