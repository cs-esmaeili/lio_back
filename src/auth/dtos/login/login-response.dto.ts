import { ApiProperty } from '@nestjs/swagger';
import { PHONE_NUMBER_EXAMPLE } from '../../../config/configuration';

export class LoginResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: PHONE_NUMBER_EXAMPLE, description: 'Phone number (login identifier)' })
  username!: string;

  @ApiProperty({ example: 'Ali', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'Rezaei', nullable: true })
  lastName!: string | null;

  @ApiProperty({ example: false, description: 'Whether the user can open the admin dashboard panel' })
  showAdminPanel!: boolean;
}
