import { ApiProperty } from '@nestjs/swagger';

export class PublicUserDto {
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

export class OtpRequestResponseDto {
  @ApiProperty({ example: 120, description: 'OTP validity window in seconds.' })
  ttlSeconds!: number;
}

export class OkResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}

export class MeUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '09123456789' })
  phone!: string;
}

export class MeResponseDto {
  @ApiProperty({ example: true })
  authenticated!: boolean;

  @ApiProperty({ type: MeUserDto, nullable: true })
  user!: MeUserDto | null;

  @ApiProperty({ example: false })
  loading!: boolean;
}
