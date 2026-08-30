import { ApiProperty } from '@nestjs/swagger';

export class HashPasswordResponseDto {
  @ApiProperty({
    description: 'Argon2id hash of the password',
    example: '$argon2id$v=19$m=19456,t=2,p=1$...',
  })
  hash!: string;
}
