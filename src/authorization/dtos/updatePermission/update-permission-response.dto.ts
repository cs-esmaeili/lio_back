import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'product:write' })
  name!: string;

  @ApiProperty({ example: 'Create and edit products', nullable: true })
  description!: string | null;
}
