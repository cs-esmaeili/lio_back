import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class HashPasswordRequestDto {
  @ApiProperty({
    description: 'Plain password to hash',
    example: 'secret-password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
