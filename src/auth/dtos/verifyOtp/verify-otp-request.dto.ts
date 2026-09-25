import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpRequestDto {
  @ApiProperty({
    description: 'Phone number in 09XXXXXXXXX format',
    example: '09123456789',
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  username!: string;

  @ApiProperty({
    description: 'Four-digit OTP code',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  code!: string;
}
