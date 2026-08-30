import { ApiProperty } from '@nestjs/swagger';

export class DeleteRoleResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
