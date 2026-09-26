import { Global, Module } from '@nestjs/common';
import { AppLogger } from './logger.service';
import { LoggerController } from './logger.controller';

/**
 * File logger. Global so any provider can inject `AppLogger` without importing
 * this module.
 */
@Global()
@Module({
  controllers: [LoggerController],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
