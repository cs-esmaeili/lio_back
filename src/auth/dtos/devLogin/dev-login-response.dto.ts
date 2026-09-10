import { ApiProperty } from '@nestjs/swagger';

export class DevLoginUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '09123456789' })
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
}
