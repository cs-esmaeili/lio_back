import { ApiProperty } from '@nestjs/swagger';

export class DeleteAttributeResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
