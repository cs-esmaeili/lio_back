import { ApiProperty } from '@nestjs/swagger';

export class DeleteByKeyResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
