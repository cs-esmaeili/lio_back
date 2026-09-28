import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/** Iranian national code: exactly 10 digits. */
export const NATIONAL_CODE_PATTERN = /^\d{10}$/;

/**
 * Editable fields of the current user's profile. `username` and the user's
 * addresses are intentionally not part of this contract.
 */
export class UpdateProfileRequestDto {
  @ApiPropertyOptional({ example: 'Ali' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Rezaei' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'Iranian national code (10 digits)' })
  @IsOptional()
  @IsString()
  @Matches(NATIONAL_CODE_PATTERN, { message: 'nationalCode must be exactly 10 digits' })
  nationalCode?: string;
}
