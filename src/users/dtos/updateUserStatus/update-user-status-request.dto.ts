import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserStatus } from 'src/database/schema';

export class UpdateUserStatusRequestDto {
  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus', example: UserStatus.DISABLED })
  @IsEnum(UserStatus)
  status!: UserStatus;
}
