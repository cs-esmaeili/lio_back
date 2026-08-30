import { ApiProperty } from '@nestjs/swagger';

export class MeUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '09123456789', description: 'Phone number (login identifier)' })
  username!: string;
}

export class MeResponseDto {
  @ApiProperty({ example: true })
  authenticated!: boolean;

  @ApiProperty({ type: MeUserDto, nullable: true })
  user!: MeUserDto | null;

  @ApiProperty({ example: false })
  loading!: boolean;
}
