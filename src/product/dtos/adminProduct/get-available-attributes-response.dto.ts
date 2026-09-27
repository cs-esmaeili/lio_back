import { ApiProperty } from '@nestjs/swagger';
import { AdminAvailableAttributeDto } from './admin-available-attribute.dto';

export class GetAvailableAttributesResponseDto {
  @ApiProperty({ type: [AdminAvailableAttributeDto] })
  attributes!: AdminAvailableAttributeDto[];
}
