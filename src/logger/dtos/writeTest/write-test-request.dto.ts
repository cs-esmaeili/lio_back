import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { DEFAULT_SCOPE, LOG_LEVELS, SCOPE_RE, type LogLevel } from '../../logger.constants';

export class WriteTestRequestDto {
  @ApiPropertyOptional({
    description: 'Scope (service) the entry belongs to',
    example: 'sms',
    default: DEFAULT_SCOPE,
  })
  @IsOptional()
  @IsString()
  @Matches(SCOPE_RE, { message: 'scope must be lowercase letters, digits or dashes' })
  scope: string = DEFAULT_SCOPE;

  @ApiPropertyOptional({ description: 'Log level', enum: LOG_LEVELS, default: 'info' })
  @IsOptional()
  @IsIn([...LOG_LEVELS])
  level: LogLevel = 'info';

  @ApiProperty({ description: 'Message to log', example: 'hello from the logger' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ description: 'Extra structured fields', type: Object })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
