import { Injectable, LoggerService } from '@nestjs/common';
import { DateTime } from 'luxon';
import { join } from 'node:path';
import pino from 'pino';
import { COMBINED_CHANNEL, DEFAULT_CHANNEL, DEFAULT_LOG_DIR, type LogChannel } from './logger.constants';

interface ChannelWriter {
  /** Absolute path of the file this writer appends to. */
  file: string;
  logger: pino.Logger;
  destination: ReturnType<typeof pino.destination>;
}

/** Maps a channel to the pino level used for the entry written into it. */
const CHANNEL_LEVELS: Record<string, pino.Level> = {
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
  fatal: 'fatal',
};

/**
 * Small file logger built on pino.
 *
 * Every entry is written as one JSON line to `logs/<channel>/<yyyy-MM-dd>.log`
 * and mirrored to `logs/combined/<yyyy-MM-dd>.log`. The date in the file name is
 * the Gregorian local date; a new file is started automatically when the day
 * changes.
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly logDir: string;
  private readonly writers = new Map<string, ChannelWriter>();

  constructor() {
    this.logDir = DEFAULT_LOG_DIR;
  }

  // --- Nest `LoggerService` compatible methods -----------------------------

  log(message: any, ...optionalParams: any[]): void {
    this.write(DEFAULT_CHANNEL, message, this.metaOf(optionalParams));
  }

  error(message: any, ...optionalParams: any[]): void {
    this.write('error', message, this.metaOf(optionalParams));
  }

  warn(message: any, ...optionalParams: any[]): void {
    this.write('warn', message, this.metaOf(optionalParams));
  }

  debug(message: any, ...optionalParams: any[]): void {
    this.write('debug', message, this.metaOf(optionalParams));
  }

  verbose(message: any, ...optionalParams: any[]): void {
    this.write('debug', message, this.metaOf(optionalParams));
  }

  fatal(message: any, ...optionalParams: any[]): void {
    this.write('fatal', message, this.metaOf(optionalParams));
  }

  // --- Explicit channel API ------------------------------------------------

  info(message: unknown, meta: Record<string, unknown> = {}): string {
    return this.write('info', message, meta);
  }

  /**
   * Write a single entry to `channel` (and to the combined file).
   *
   * @returns the absolute path of the channel file the entry was written to.
   */
  write(channel: LogChannel, message: unknown, meta: Record<string, unknown> = {}): string {
    const now = new Date();
    const level = CHANNEL_LEVELS[channel] ?? 'info';
    const entry = { ...meta, channel, message };

    const channelWriter = this.writerFor(channel, now);
    const combinedWriter = this.writerFor(COMBINED_CHANNEL, now);
    this.emit(channelWriter.logger, level, entry);
    this.emit(combinedWriter.logger, level, entry);

    return channelWriter.file;
  }

  /** Flushes every open file. */
  flush(): void {
    for (const writer of this.writers.values()) {
      writer.logger.flush();
    }
  }

  private emit(logger: pino.Logger, level: pino.Level, entry: Record<string, unknown>): void {
    logger[level](entry);
  }

  /** Returns (and caches) the writer for `channel` on the date of `now`. */
  private writerFor(channel: string, now: Date): ChannelWriter {
    const date = DateTime.fromJSDate(now).toFormat('yyyy-MM-dd');
    const key = `${channel}:${date}`;

    const cached = this.writers.get(key);
    if (cached) return cached;

    const file = join(this.logDir, channel, `${date}.log`);
    const destination = pino.destination({ dest: file, mkdir: true, sync: true });
    // Keep both the label ("error") and pino's numeric level (50).
    const logger = pino(
      {
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: { level: (label, number) => ({ level: label, levelNumber: number }) },
      },
      destination,
    );
    const writer: ChannelWriter = { file, logger, destination };
    this.writers.set(key, writer);

    // Drop the previous day's writer for this channel so file handles stay bounded.
    for (const [otherKey, other] of this.writers) {
      if (otherKey !== key && otherKey.startsWith(`${channel}:`)) {
        other.logger.flush();
        other.destination.end();
        this.writers.delete(otherKey);
      }
    }

    return writer;
  }

  /** Nest passes the context (and params) as trailing arguments; normalize them. */
  private metaOf(optionalParams: unknown[]): Record<string, unknown> {
    const meta: Record<string, unknown> = {};
    for (const param of optionalParams) {
      if (typeof param === 'string') {
        meta.context = param;
      } else if (param && typeof param === 'object') {
        Object.assign(meta, param);
      }
    }
    return meta;
  }
}
