import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AssignRoleRequestDto {
  @ApiProperty({ description: 'Role id to assign to the user', example: 1 })
  @IsInt()
  roleId!: number;
}
