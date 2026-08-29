import { IsString,IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class OtpRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  @MinLength(11)
  phone!: string;
}
