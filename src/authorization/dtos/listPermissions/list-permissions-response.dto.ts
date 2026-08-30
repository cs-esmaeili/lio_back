import { ApiProperty } from '@nestjs/swagger';

export class ListPermissionsResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'role:read' })
  name!: string;

  @ApiProperty({ example: 'List roles', nullable: true })
  description!: string | null;
}
