import { ApiProperty } from '@nestjs/swagger';
import { PHONE_NUMBER_EXAMPLE } from '../../../config/configuration';

export class DevLoginUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: PHONE_NUMBER_EXAMPLE })
  username!: string;

  @ApiProperty({ example: 'Dev', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'User', nullable: true })
  lastName!: string | null;
}

export class DevLoginResponseDto {
  @ApiProperty({
    example: 'dGhpcyBpcyBhIGNzcmYgdG9rZW4',
    description: 'CSRF token to echo back in the X-CSRF-Token header.',
  })
  csrfToken!: string;

  @ApiProperty({ type: DevLoginUserDto })
  user!: DevLoginUserDto;

  @ApiProperty({ example: false, description: 'Whether the user can open the admin dashboard panel' })
  showAdminPanel!: boolean;
}
