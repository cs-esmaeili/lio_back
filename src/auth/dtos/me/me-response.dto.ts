import { ApiProperty } from '@nestjs/swagger';

export class MeUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '09123456789', description: 'Phone number (login identifier)' })
  username!: string;

  @ApiProperty({ example: 'Ali', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'Rezaei', nullable: true })
  lastName!: string | null;
}

export class MeResponseDto {
  @ApiProperty({ example: true })
  authenticated!: boolean;

  @ApiProperty({ type: MeUserDto, nullable: true })
  user!: MeUserDto | null;

  @ApiProperty({ example: ['user:read'], type: [String], description: 'Permissions granted to the current user' })
  permissions!: string[];

  @ApiProperty({ example: false, description: 'Whether the user can open the admin dashboard panel' })
  showAdminPanel!: boolean;
}
