import { ApiProperty } from '@nestjs/swagger';

export class DeleteFileResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
