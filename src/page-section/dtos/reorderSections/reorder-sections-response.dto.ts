import { ApiProperty } from '@nestjs/swagger';

export class ReorderSectionsResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
