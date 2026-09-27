import { ApiProperty } from '@nestjs/swagger';
import { AdminProductDto } from './admin-product.dto';
import { AdminAvailableAttributeDto } from './admin-available-attribute.dto';

export class GetAdminProductResponseDto {
  @ApiProperty({ type: AdminProductDto })
  product!: AdminProductDto;

  @ApiProperty({
    type: [AdminAvailableAttributeDto],
    description: 'Attributes available for this product, derived from its categories',
  })
  availableAttributes!: AdminAvailableAttributeDto[];
}
