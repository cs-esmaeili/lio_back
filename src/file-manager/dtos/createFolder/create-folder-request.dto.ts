import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFolderRequestDto {
  @ApiProperty({
    description: 'Relative folder path to create',
    example: 'images/banners',
  })
  @IsString()
  @IsNotEmpty()
  path!: string;
}
