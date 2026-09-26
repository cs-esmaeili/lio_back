import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateAddressRequestDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode!: string;

  @ApiProperty({ example: 12, description: 'Location id (province/city)' })
  @IsInt()
  @Min(1)
  locationId!: number;

  @ApiPropertyOptional({ example: false, default: false, description: 'Mark this as the default address' })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
