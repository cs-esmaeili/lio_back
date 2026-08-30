import { ApiProperty } from '@nestjs/swagger';

export class DeletePermissionResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
