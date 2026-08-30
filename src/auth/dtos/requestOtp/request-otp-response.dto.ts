import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpResponseDto {
  @ApiProperty({ example: 120, description: 'OTP validity window in seconds.' })
  ttlSeconds!: number;
}
