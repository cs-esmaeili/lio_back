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
    description: 'Six-digit OTP code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code!: string;
}
