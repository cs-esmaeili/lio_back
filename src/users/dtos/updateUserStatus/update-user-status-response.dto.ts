import { ApiProperty } from '@nestjs/swagger';
import { PHONE_NUMBER_EXAMPLE } from '../../../config/configuration';
import { UserStatus } from 'src/database/schema';

export class AdminUserRoleDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'admin' })
  name!: string;

  @ApiProperty({ example: 'Full access', nullable: true })
  description!: string | null;
}

export class UpdateUserStatusResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: PHONE_NUMBER_EXAMPLE })
  username!: string;

  @ApiProperty({ example: 'Admin', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'Esmaeili', nullable: true })
  lastName!: string | null;

  @ApiProperty({ example: '1234567890', nullable: true })
  nationalCode!: string | null;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus', example: UserStatus.DISABLED })
  status!: UserStatus;

  @ApiProperty({ type: AdminUserRoleDto })
  role!: AdminUserRoleDto;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  updatedAt!: string;
}
