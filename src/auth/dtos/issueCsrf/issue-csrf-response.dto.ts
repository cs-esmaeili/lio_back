import { ApiProperty } from '@nestjs/swagger';

export class IssueCsrfResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({
    example: 'dGhpcyBpcyBhIGNzcmYgdG9rZW4',
    description: 'CSRF token to echo back in the X-CSRF-Token header.',
  })
  csrfToken!: string;
}
