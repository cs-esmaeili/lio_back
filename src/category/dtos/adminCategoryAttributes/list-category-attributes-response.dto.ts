import { ApiProperty } from '@nestjs/swagger';
import { AdminCategoryAttributeDto } from './admin-category-attribute.dto';

export class ListCategoryAttributesResponseDto {
  @ApiProperty({ type: [AdminCategoryAttributeDto] })
  attributes!: AdminCategoryAttributeDto[];
}
