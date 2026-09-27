import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional } from 'class-validator';

/** Accepts `?categoryIds=1,2` or repeated `?categoryIds=1&categoryIds=2`. */
export class GetAvailableAttributesRequestDto {
  @ApiPropertyOptional({ type: [Number], example: [3, 8], description: 'Category ids (comma separated or repeated)' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
    return raw.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0);
  })
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];
}
