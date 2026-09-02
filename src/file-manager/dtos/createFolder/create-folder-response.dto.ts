import { ApiProperty } from '@nestjs/swagger';

export class CreateFolderResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'images/banners' })
  path!: string;
}
