import { ApiProperty } from '@nestjs/swagger';
import { IsInt, ValidateIf } from 'class-validator';

export class AssignRoleRequestDto {
  @ApiProperty({ description: 'Role id, or null to remove the role', example: 1, nullable: true })
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  roleId!: number | null;
}
