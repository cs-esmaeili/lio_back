import { ApiProperty } from '@nestjs/swagger';
import { AdminCategoryDto } from './admin-category.dto';

export class ListAdminCategoriesResponseDto {
  @ApiProperty({ type: [AdminCategoryDto], description: 'Flat list; build the tree from `parentId`' })
  categories!: AdminCategoryDto[];
}
