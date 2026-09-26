import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressLocationDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'Tehran' })
  province!: string;

  @ApiProperty({ example: 'Tehran' })
  city!: string;
}

export class CreateAddressResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Home' })
  title!: string;

  @ApiProperty({ example: '1234567890' })
  postalCode!: string;

  @ApiProperty({ example: true, description: 'Whether this is the default address' })
  isMain!: boolean;

  @ApiProperty({ example: 12 })
  locationId!: number;

  @ApiProperty({ type: CreateAddressLocationDto })
  location!: CreateAddressLocationDto;

  @ApiProperty({ example: '2026-09-02T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-09-02T12:00:00.000Z' })
  updatedAt!: string;
}
