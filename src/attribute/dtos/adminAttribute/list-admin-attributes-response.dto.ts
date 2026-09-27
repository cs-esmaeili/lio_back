import { ApiProperty } from '@nestjs/swagger';
import { AdminAttributeDto } from './admin-attribute.dto';

export class ListAdminAttributesResponseDto {
  @ApiProperty({ type: [AdminAttributeDto] })
  attributes!: AdminAttributeDto[];
}
