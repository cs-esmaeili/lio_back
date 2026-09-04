import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class ReorderSectionsRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  pageId!: number;

  @ApiProperty({ type: Number, isArray: true, example: [3, 1, 2] })
  @IsArray()
  @IsInt({ each: true })
  orderedIds!: number[];
}
