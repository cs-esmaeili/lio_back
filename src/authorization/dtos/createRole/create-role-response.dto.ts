import { ApiProperty } from '@nestjs/swagger';

export class RolePermissionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'role:read' })
  name!: string;

  @ApiProperty({ example: 'List roles', nullable: true })
  description!: string | null;
}

export class CreateRoleResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'admin' })
  name!: string;

  @ApiProperty({ example: 'Full access', nullable: true })
  description!: string | null;

  @ApiProperty({ type: RolePermissionDto, isArray: true })
  permissions!: RolePermissionDto[];
}
