import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RequestOtpRequestDto {
  @ApiProperty({
    description: 'Phone number in 09XXXXXXXXX format',
    example: '09123456789',
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  username!: string;
}
