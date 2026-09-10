import { ApiProperty } from '@nestjs/swagger';
import { EntityType } from 'src/generated/prisma/client';
import { GetSectionResponseDto } from '../getSection/get-section-response.dto';

export class PageSummaryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: EntityType, enumName: 'EntityType', example: EntityType.HOME })
  entityType!: EntityType;

  @ApiProperty({ example: null, nullable: true })
  entityId!: number | null;

  @ApiProperty({ example: 'home' })
  slug!: string;
}

export class GetPageSectionsResponseDto {
  @ApiProperty({ type: PageSummaryDto })
  page!: PageSummaryDto;

  @ApiProperty({ type: GetSectionResponseDto, isArray: true })
  sections!: GetSectionResponseDto[];
}
