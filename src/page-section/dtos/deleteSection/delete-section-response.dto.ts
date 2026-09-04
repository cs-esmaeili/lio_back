import { ApiProperty } from '@nestjs/swagger';

export class DeleteSectionResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
