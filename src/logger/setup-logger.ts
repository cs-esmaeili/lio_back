import { Logger, type INestApplication, type NestApplicationOptions } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from './logger.service';

/** Buffer startup logs so they go through the configured logger once attached. */
export function loggerNestOptions(): NestApplicationOptions {
  return { bufferLogs: true };
}

/** Startup/console logging handle returned by {@link setupLogger}. */
export interface AppLogging {
  /** Write one startup line (structured logger when enabled, `console.log` otherwise). */
  log(line: string): void;
}

/**
 * Wires the custom logger into the Nest app.
 *
 * When `logger.enabled` is false the custom logger is fully disabled: buffered
 * startup logs are flushed through Nest's default console logger and `AppLogger`
 * stays unused. Otherwise it becomes the app logger and process-level error
 * handlers are registered.
 */
export function setupLogger(app: INestApplication): AppLogging {
  const enabled = app.get(ConfigService).get<boolean>('logger.enabled') ?? true;

  if (!enabled) {
    // No custom logger attached: flush the buffered bootstrap logs to the default one.
    Logger.flush();
    return { log: (line) => console.log(line) };
  }

  const logger = app.get(AppLogger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  process.on('uncaughtException', (error) => {
    logger.scope('app').fatal(error, { event: 'uncaughtException' });
  });
  process.on('unhandledRejection', (reason) => {
    logger.scope('app').error(reason instanceof Error ? reason : new Error(String(reason)), { event: 'unhandledRejection' });
  });

  const appLog = logger.scope('app');
  return { log: (line) => appLog.info(line) };
}
