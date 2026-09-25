import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AppLogger } from './logger.service';
import { WriteTestRequestDto } from './dtos/writeTest/write-test-request.dto';
import { WriteTestResponseDto } from './dtos/writeTest/write-test-response.dto';

/** Temporary endpoint used to exercise the file logger. */
@Controller('logger')
export class LoggerController {
  constructor(private readonly logger: AppLogger) {}

  @ApiOperation({ summary: 'Write a test log entry (dev only)' })
  @ApiBody({ type: WriteTestRequestDto })
  @ApiOkResponse({ description: 'Log entry written', type: WriteTestResponseDto })
  @HttpCode(HttpStatus.OK)
  @Post('test')
  writeTest(@Body() body: WriteTestRequestDto): WriteTestResponseDto {
    const file = this.logger.write(body.channel, body.message, body.meta ?? {});
    return { channel: body.channel, file, writtenAt: new Date().toISOString() };
  }
}
