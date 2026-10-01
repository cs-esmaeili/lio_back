import { ApiProperty } from '@nestjs/swagger';
import { PHONE_NUMBER_EXAMPLE } from '../../../config/configuration';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SaveContactFormRequestDto {
  @ApiProperty({ description: 'Sender full name', example: 'علی رضایی', minLength: 3, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'Iranian mobile number in 09XXXXXXXXX format', example: PHONE_NUMBER_EXAMPLE })
  @IsString()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل وارد شده معتبر نیست' })
  phone!: string;

  @ApiProperty({ description: 'Message body', example: 'سلام، درباره سفارش ...', minLength: 10, maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  message!: string;
}
