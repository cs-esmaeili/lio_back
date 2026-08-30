import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '09123456789', description: 'Phone number (login identifier)' })
  username!: string;

  @ApiProperty({ example: 'Ali', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'Rezaei', nullable: true })
  lastName!: string | null;
}
