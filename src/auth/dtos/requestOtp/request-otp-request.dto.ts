import { ApiProperty } from '@nestjs/swagger';
import { PHONE_NUMBER_EXAMPLE } from '../../../config/configuration';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RequestOtpRequestDto {
  @ApiProperty({
    description: 'Phone number in 09XXXXXXXXX format',
    example: PHONE_NUMBER_EXAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  username!: string;
}
