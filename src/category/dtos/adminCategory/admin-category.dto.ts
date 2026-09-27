import { ApiProperty } from '@nestjs/swagger';

/**
 * A single category as returned by the admin endpoints. Unlike the public tree
 * DTO this is flat (`parentId` instead of `children`) so the dashboard can
 * rebuild the hierarchy and move nodes around freely.
 */
export class AdminCategoryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: null, nullable: true, description: 'Parent category id; null for a root category' })
  parentId!: number | null;

  @ApiProperty({ example: 'پوشاک' })
  name!: string;

  @ApiProperty({ example: 'clothing' })
  slug!: string;

  @ApiProperty({ example: 12, nullable: true, description: 'Category image file id' })
  imageId!: number | null;

  @ApiProperty({ example: '/uploads/images/category-1.png', nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ example: 3, description: 'Number of direct child categories' })
  childCount!: number;

  @ApiProperty({ example: 8, description: 'Number of products linked to this category' })
  productCount!: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: string;
}
