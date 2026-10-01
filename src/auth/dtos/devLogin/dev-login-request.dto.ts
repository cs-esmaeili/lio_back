import { ApiProperty } from '@nestjs/swagger';
import { PHONE_NUMBER_EXAMPLE } from '../../../config/configuration';
import { IsNotEmpty, IsString } from 'class-validator';

export class DevLoginRequestDto {
  @ApiProperty({
    description: 'Phone number to log in as.',
    example: PHONE_NUMBER_EXAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  username!: string;
}
