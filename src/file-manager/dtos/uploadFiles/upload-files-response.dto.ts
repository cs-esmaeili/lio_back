import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FileDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'photo.png' })
  originalName!: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6-9f3a2b1c.png' })
  storedName!: string;

  @ApiProperty({ example: 'images/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6-9f3a2b1c.png' })
  path!: string;

  @ApiProperty({ example: '/uploads/images/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6-9f3a2b1c.png' })
  url!: string;

  @ApiProperty({ example: 'image/png' })
  mimeType!: string;

  @ApiProperty({ example: 2048 })
  size!: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  uploaderId?: number | null;

  @ApiProperty({ example: '2026-09-02T12:00:00.000Z' })
  createdAt!: string;
}

export class UploadFilesResponseDto {
  @ApiProperty({ type: FileDto, isArray: true })
  files!: FileDto[];
}
