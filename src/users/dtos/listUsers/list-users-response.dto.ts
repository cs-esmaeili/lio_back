import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from 'src/database/schema';

export class AdminUserRoleDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'admin' })
  name!: string;

  @ApiProperty({ example: 'Full access', nullable: true })
  description!: string | null;
}

export class AdminUserListItemDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '09123456789' })
  username!: string;

  @ApiProperty({ example: 'Admin', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'Esmaeili', nullable: true })
  lastName!: string | null;

  @ApiProperty({ example: '1234567890', nullable: true })
  nationalCode!: string | null;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus', example: UserStatus.ACTIVE })
  status!: UserStatus;

  @ApiProperty({ type: AdminUserRoleDto })
  role!: AdminUserRoleDto;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  updatedAt!: string;
}

export class ListUsersResponseDto {
  @ApiProperty({ type: [AdminUserListItemDto] })
  items!: AdminUserListItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}
