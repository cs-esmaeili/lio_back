import { Injectable, LoggerService } from '@nestjs/common';
import { DateTime } from 'luxon';
import { readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import pino from 'pino';
import {
  COMBINED_SCOPE,
  DEFAULT_LOG_DIR,
  DEFAULT_LOG_LEVEL,
  DEFAULT_SCOPE,
  LOG_PRUNE_INTERVAL_MS,
  LOG_REDACT_PATHS,
  LOG_RETENTION_DAYS,
  SCOPE_RE,
  type LogLevel,
} from './logger.constants';

interface FileWriter {
  /** Absolute path of the file this writer appends to. */
  file: string;
  logger: pino.Logger;
  destination: ReturnType<typeof pino.destination>;
}

/** A logger bound to a scope (service), e.g. `logger.scope('sms')`. */
export interface ScopedLogger {
  debug(message: unknown, meta?: Record<string, unknown>): void;
  info(message: unknown, meta?: Record<string, unknown>): void;
  warn(message: unknown, meta?: Record<string, unknown>): void;
  error(message: unknown, meta?: Record<string, unknown>): void;
  fatal(message: unknown, meta?: Record<string, unknown>): void;
}

/**
 * File logger built on pino.
 *
 * Every entry is one JSON line written to:
 * - `logs/<scope>/<yyyy-MM-dd>.log` — the service's own file, all levels;
 * - `logs/combined/<yyyy-MM-dd>.log` — every entry, for a single timeline.
 *
 * The `scope` comes from `AppLogger#scope()` or, when Nest delegates
 * `new Logger(Context)`, from that context. Unknown scopes fall back to `app`.
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly writers = new Map<string, FileWriter>();
  private lastPruneAt = 0;
  private pruning: Promise<void> | null = null;

  // --- Nest `LoggerService` compatible methods -----------------------------

  log(message: any, ...optionalParams: any[]): void {
    const { scope, meta } = this.parseParams(optionalParams);
    this.write(scope, 'info', message, meta);
  }

  error(message: any, ...optionalParams: any[]): void {
    const { scope, meta } = this.parseParams(optionalParams);
    this.write(scope, 'error', message, meta);
  }

  warn(message: any, ...optionalParams: any[]): void {
    const { scope, meta } = this.parseParams(optionalParams);
    this.write(scope, 'warn', message, meta);
  }

  debug(message: any, ...optionalParams: any[]): void {
    const { scope, meta } = this.parseParams(optionalParams);
    this.write(scope, 'debug', message, meta);
  }

  verbose(message: any, ...optionalParams: any[]): void {
    const { scope, meta } = this.parseParams(optionalParams);
    this.write(scope, 'debug', message, meta);
  }

  fatal(message: any, ...optionalParams: any[]): void {
    const { scope, meta } = this.parseParams(optionalParams);
    this.write(scope, 'fatal', message, meta);
  }

  // --- Explicit scoped API -------------------------------------------------

  /** Returns a logger that writes every entry under `scope`. */
  scope(scope: string): ScopedLogger {
    const name = this.normalizeScope(scope);
    return {
      debug: (message, meta) => this.write(name, 'debug', message, meta),
      info: (message, meta) => this.write(name, 'info', message, meta),
      warn: (message, meta) => this.write(name, 'warn', message, meta),
      error: (message, meta) => this.write(name, 'error', message, meta),
      fatal: (message, meta) => this.write(name, 'fatal', message, meta),
    };
  }

  /**
   * Write one entry to `<scope>` and to the combined file.
   *
   * @returns the absolute path of the scope file the entry was written to.
   */
  write(scope: string, level: LogLevel, message: unknown, meta: Record<string, unknown> = {}): string {
    const now = new Date();
    const name = this.normalizeScope(scope);
    const entry = this.buildEntry(name, message, meta);

    const scopeWriter = this.writerFor(name, now);
    this.emit(scopeWriter, level, entry);
    this.emit(this.writerFor(COMBINED_SCOPE, now), level, entry);

    this.maybePrune(now.getTime());
    return scopeWriter.file;
  }

  /** Flushes every open file. */
  flush(): void {
    for (const writer of this.writers.values()) {
      writer.logger.flush();
    }
  }

  // --- internals -----------------------------------------------------------

  private emit(writer: FileWriter, level: LogLevel, entry: Record<string, unknown>): void {
    writer.logger[level](entry);
  }

  private buildEntry(scope: string, message: unknown, meta: Record<string, unknown>): Record<string, unknown> {
    const entry: Record<string, unknown> = { ...meta, scope };
    if (message instanceof Error) {
      // pino serializes an `Error` under the `err` key (type/message/stack).
      entry.message = message.message;
      entry.err = message;
    } else {
      entry.message = message;
    }
    return entry;
  }

  /** Returns (and caches) the writer for `scope` on the date of `now`. */
  private writerFor(scope: string, now: Date): FileWriter {
    const date = DateTime.fromJSDate(now).toFormat('yyyy-MM-dd');
    const key = `${scope}:${date}`;

    const cached = this.writers.get(key);
    if (cached) return cached;

    const file = join(DEFAULT_LOG_DIR, scope, `${date}.log`);
    const destination = pino.destination({ dest: file, mkdir: true, sync: true });
    const logger = pino(
      {
        level: DEFAULT_LOG_LEVEL,
        messageKey: 'message',
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: { level: (label, number) => ({ level: label, levelNumber: number }) },
        redact: { paths: LOG_REDACT_PATHS, censor: '[redacted]' },
      },
      destination,
    );
    const writer: FileWriter = { file, logger, destination };
    this.writers.set(key, writer);

    // Drop the previous day's writer for this scope so file handles stay bounded.
    for (const [otherKey, other] of this.writers) {
      if (otherKey !== key && otherKey.startsWith(`${scope}:`)) {
        other.logger.flush();
        other.destination.end();
        this.writers.delete(otherKey);
      }
    }

    return writer;
  }

  private normalizeScope(scope: string | undefined): string {
    const name = (scope ?? DEFAULT_SCOPE).trim().toLowerCase();
    return SCOPE_RE.test(name) ? name : DEFAULT_SCOPE;
  }

  /** Nest passes the context (and params) as trailing arguments; normalize them. */
  private parseParams(optionalParams: unknown[]): { scope: string; meta: Record<string, unknown> } {
    const strings: string[] = [];
    const meta: Record<string, unknown> = {};
    for (const param of optionalParams) {
      if (typeof param === 'string') {
        strings.push(param);
      } else if (param && typeof param === 'object') {
        Object.assign(meta, param);
      }
    }

    // Nest appends the context last; anything before it is a stack/details string.
    const scope = strings.length ? strings[strings.length - 1] : DEFAULT_SCOPE;
    if (strings.length > 1) {
      meta.stack = strings.slice(0, -1).join('\n');
    }
    return { scope: this.normalizeScope(scope), meta };
  }

  /** Runs the day-based retention lazily, at most once per interval. */
  private maybePrune(nowMs: number): void {
    if (LOG_RETENTION_DAYS <= 0 || this.pruning) return;
    if (nowMs - this.lastPruneAt < LOG_PRUNE_INTERVAL_MS) return;

    this.lastPruneAt = nowMs;
    this.pruning = this.prune(nowMs)
      .catch(() => undefined)
      .finally(() => {
        this.pruning = null;
      });
  }

  /** Deletes `logs/<scope>/<date>.log` files older than `LOG_RETENTION_DAYS`. */
  private async prune(nowMs: number): Promise<void> {
    const cutoff = DateTime.fromMillis(nowMs).minus({ days: LOG_RETENTION_DAYS }).toFormat('yyyy-MM-dd');
    const entries = await readdir(DEFAULT_LOG_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = join(DEFAULT_LOG_DIR, entry.name);
      const files = await readdir(dir).catch(() => [] as string[]);

      for (const file of files) {
        const date = /^(\d{4}-\d{2}-\d{2})\.log$/.exec(file)?.[1];
        if (date && date < cutoff) {
          await unlink(join(dir, file)).catch(() => undefined);
        }
      }
    }
  }
}
