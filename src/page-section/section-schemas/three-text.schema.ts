import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ThreeTextDataDto {
  @ApiProperty({ type: String, isArray: true, example: ['heading', 'subheading', 'body'] })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  texts!: string[];
}

export function mapThreeTextData(data: unknown): Record<string, unknown> {
  const raw = (data ?? {}) as { texts?: unknown[] };
  const texts = (Array.isArray(raw.texts) ? raw.texts : []) as string[];
  return { texts };
}
