import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'پوشاک' })
  name!: string;

  @ApiProperty({ example: 'clothing' })
  slug!: string;

  @ApiProperty({ example: '/uploads/images/category-1.png', nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ type: () => [CategoryDto] })
  children!: CategoryDto[];
}

export class GetCategoriesResponseDto {
  @ApiProperty({ type: [CategoryDto] })
  categories!: CategoryDto[];
}
