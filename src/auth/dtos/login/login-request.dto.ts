import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    description: 'Phone number in 09XXXXXXXXX format',
    example: '09123456789',
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  username!: string;

  @ApiProperty({
    description: 'Account password',
    example: 'secret-password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
