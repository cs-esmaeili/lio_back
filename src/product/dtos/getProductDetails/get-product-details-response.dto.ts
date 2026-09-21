import { ApiProperty } from '@nestjs/swagger';

export class ProductDetailsImageDto {
  @ApiProperty({ example: 7 })
  id!: number;

  @ApiProperty({ type: String, example: '/uploads/images/product-1.png', nullable: true })
  url!: string | null;

  @ApiProperty({ example: true })
  isPrimary!: boolean;

  @ApiProperty({ example: false })
  isThumbnail!: boolean;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class ProductDetailsCategoryDto {
  @ApiProperty({ example: 224 })
  id!: number;

  @ApiProperty({ example: 'سیگار' })
  name!: string;

  @ApiProperty({ example: 'sigar' })
  slug!: string;

  @ApiProperty({ type: String, example: '/uploads/images/category.png', nullable: true })
  imageUrl!: string | null;
}

export class ProductDetailsTagDto {
  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: 'ایرانی' })
  name!: string;

  @ApiProperty({ example: 'irani' })
  slug!: string;
}

export class ProductVariantValueDto {
  @ApiProperty({ example: 1, description: 'Variant-defining attribute id' })
  attributeId!: number;

  @ApiProperty({ example: 'رنگ' })
  attributeTitle!: string;

  @ApiProperty({ example: 1, description: 'Attribute value id' })
  valueId!: number;

  @ApiProperty({ example: 'قرمز' })
  valueTitle!: string;
}

export class ProductVariantDto {
  @ApiProperty({ example: 3744, description: 'Variant id' })
  id!: number;

  @ApiProperty({ example: 'SEED-SKU-1-1' })
  sku!: string;

  @ApiProperty({
    type: [ProductVariantValueDto],
    description: 'One entry per variant-defining attribute. A selection matches this variant when every entry matches the selected value of its attribute.',
  })
  values!: ProductVariantValueDto[];

  @ApiProperty({ example: 1694000, description: 'Selling price' })
  price!: number;

  @ApiProperty({ type: Number, example: 1744000, nullable: true, description: 'Reference price before discount' })
  compareAtPrice!: number | null;

  @ApiProperty({ example: 3, description: 'Discount percentage derived from compareAtPrice' })
  discountPercent!: number;

  @ApiProperty({ example: 12 })
  stock!: number;

  @ApiProperty({ example: true })
  isAvailable!: boolean;

  @ApiProperty({ type: String, example: 'call', nullable: true, description: 'Set to "call" when the variant has no price' })
  zeroPrice!: string | null;
}

export class ProductDetailsDto {
  @ApiProperty({ example: 3342 })
  id!: number;

  @ApiProperty({ example: 'کمل کامپکت آبی ایرانی' })
  name!: string;

  @ApiProperty({ example: 'kamel-compact-abi' })
  slug!: string;

  @ApiProperty({ type: String, example: '<p>معرفی محصول</p>', nullable: true })
  description!: string | null;

  @ApiProperty({ type: [ProductDetailsImageDto] })
  images!: ProductDetailsImageDto[];

  @ApiProperty({ type: [ProductDetailsCategoryDto] })
  categories!: ProductDetailsCategoryDto[];

  @ApiProperty({ type: [ProductDetailsTagDto] })
  tags!: ProductDetailsTagDto[];

  @ApiProperty({ type: ProductVariantDto, nullable: true })
  defaultVariant!: ProductVariantDto | null;
}

export class ProductBaseAttributeValueDto {
  @ApiProperty({ example: 1, description: 'Attribute value id' })
  valueId!: number;

  @ApiProperty({ example: 'قرمز' })
  title!: string;

  @ApiProperty({ example: true, description: 'Whether the default variant uses this value' })
  isSelected!: boolean;
}

export class ProductBaseAttributeDto {
  @ApiProperty({ example: 1, description: 'Variant-defining attribute id' })
  attributeId!: number;

  @ApiProperty({ example: 'رنگ' })
  title!: string;

  @ApiProperty({ type: [ProductBaseAttributeValueDto] })
  values!: ProductBaseAttributeValueDto[];
}

export class ProductAttributeGroupItemDto {
  @ApiProperty({ example: 12, description: 'Attribute value id' })
  valueId!: number;

  @ApiProperty({ example: 'جنس' })
  title!: string;

  @ApiProperty({ example: 'چرم' })
  value!: string;
}

export class ProductAttributeGroupDto {
  @ApiProperty({ example: 3, description: 'Attribute id' })
  attributeId!: number;

  @ApiProperty({ example: 'جنس' })
  title!: string;

  @ApiProperty({ type: [ProductAttributeGroupItemDto] })
  attributes!: ProductAttributeGroupItemDto[];
}

export class ProductCardImageDto {
  @ApiProperty({ example: 7 })
  id!: number;

  @ApiProperty({ type: String, example: '/uploads/images/product-1.png', nullable: true })
  url!: string | null;

  @ApiProperty({ example: true })
  isPrimary!: boolean;

  @ApiProperty({ example: false })
  isThumbnail!: boolean;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class ProductCardVariantDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'SEED-SKU-1-1' })
  sku!: string;

  @ApiProperty({ example: 123000 })
  price!: number;

  @ApiProperty({ type: Number, example: 173000, nullable: true })
  compareAtPrice!: number | null;

  @ApiProperty({ example: 12 })
  stock!: number;
}

export class ProductCardDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ example: 'محصول ۱' })
  name!: string;

  @ApiProperty({ example: 'product-name' })
  slug!: string;

  @ApiProperty({ type: [ProductCardImageDto] })
  images!: ProductCardImageDto[];

  @ApiProperty({ type: ProductCardVariantDto, nullable: true })
  defaultVariant!: ProductCardVariantDto | null;
}

export class ProductDetailSectionsDto {
  @ApiProperty({ type: [ProductCardDto], description: 'Products sharing at least one category with the requested product' })
  similar!: ProductCardDto[];

  @ApiProperty({ type: [ProductCardDto], description: 'Newest products across the catalogue' })
  newProducts!: ProductCardDto[];
}

export class GetProductDetailsResponseDto {
  @ApiProperty({ type: ProductDetailsDto })
  product!: ProductDetailsDto;

  @ApiProperty({
    type: [ProductBaseAttributeDto],
    description: 'Variant-defining attributes and the values the buyer can pick. Every combination of one value per attribute is a variant in `variants`.',
  })
  baseAttributes!: ProductBaseAttributeDto[];

  @ApiProperty({
    type: [ProductAttributeGroupDto],
    description: 'Spec (non variant-defining) attributes and their values for this product.',
  })
  attributeGroups!: ProductAttributeGroupDto[];

  @ApiProperty({
    type: [ProductVariantDto],
    description: 'Every variant of the product. Each variant is one combination of the base attributes and carries its own price and stock.',
  })
  variants!: ProductVariantDto[];

  @ApiProperty({ type: ProductDetailSectionsDto })
  sections!: ProductDetailSectionsDto;
}
