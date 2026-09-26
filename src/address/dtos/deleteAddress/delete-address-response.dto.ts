import { ApiProperty } from '@nestjs/swagger';

export class DeleteAddressResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
