import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { AttributeUsage, FilterType } from 'src/database/schema';

/** Machine names travel in filters and seeds, so keep them lowercase and ASCII. */
export const ATTRIBUTE_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateAttributeRequestDto {
  @ApiProperty({ example: 'color', description: 'Unique machine name — lowercase letters, digits and dashes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(ATTRIBUTE_NAME_PATTERN, { message: 'name must contain lowercase letters, digits and dashes only' })
  name!: string;

  @ApiProperty({ example: 'رنگ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ enum: AttributeUsage, enumName: 'AttributeUsage', example: AttributeUsage.VARIANT })
  @IsEnum(AttributeUsage)
  usage!: AttributeUsage;

  @ApiProperty({ enum: FilterType, enumName: 'FilterType', example: FilterType.CHECKBOX })
  @IsEnum(FilterType)
  filterType!: FilterType;

  @ApiProperty({ example: true, description: 'Whether the buyer may pick more than one value' })
  @IsBoolean()
  isMultiSelect!: boolean;
}
