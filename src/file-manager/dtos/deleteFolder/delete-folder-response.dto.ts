import { ApiProperty } from '@nestjs/swagger';

export class DeleteFolderResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
