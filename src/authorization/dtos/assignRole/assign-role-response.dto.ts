import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
