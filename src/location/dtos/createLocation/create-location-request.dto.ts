import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateLocationRequestDto {
  @ApiProperty({ example: 'Tehran' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  province!: string;

  @ApiProperty({ example: 'Tehran' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city!: string;
}
