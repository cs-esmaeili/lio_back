import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '09123456789' })
  phone!: string;

  @ApiProperty({ example: 'Ali', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'Rezaei', nullable: true })
  lastName!: string | null;

  @ApiProperty({ example: 'ali_rezaei', nullable: true })
  username!: string | null;
}
