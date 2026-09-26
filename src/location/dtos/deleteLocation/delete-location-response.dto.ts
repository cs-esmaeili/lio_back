import { ApiProperty } from '@nestjs/swagger';

export class DeleteLocationResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
