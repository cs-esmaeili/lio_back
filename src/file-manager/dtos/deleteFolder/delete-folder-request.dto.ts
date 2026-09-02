import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteFolderRequestDto {
  @ApiProperty({
    description: 'Relative folder path to delete',
    example: 'images/banners',
  })
  @IsString()
  @IsNotEmpty()
  path!: string;
}
