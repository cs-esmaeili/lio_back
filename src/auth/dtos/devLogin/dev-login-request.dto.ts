import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DevLoginRequestDto {
  @ApiProperty({
    description: 'Phone number to log in as.',
    example: '09123456789',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;
}
