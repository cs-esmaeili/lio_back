import { Injectable, LoggerService, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import pino from 'pino';
import { requestContext } from './context/request-context';
import { COMBINED_SCOPE, DEFAULT_SCOPE, LOG_PRUNE_INTERVAL_MS, LOG_REDACT_PATHS, SCOPE_RE, SERVICE_HOSTNAME, type LogLevel } from './logger.constants';

type FileDestination = ReturnType<typeof pino.destination>;

interface FileWriter {
  /** Absolute path of the scope file this writer appends to. */
  file: string;
  logger: pino.Logger;
  destinations: FileDestination[];
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
 * Structured logger built on pino.
 *
 * Every entry is one JSON line written to:
 * - stdout (primary sink, for Loki/Grafana);
 * - `logs/combined/<yyyy-MM-dd>.log` and `logs/<scope>/<yyyy-MM-dd>.log`
 *   when `logger.fileEnabled` is on (secondary sink for local browsing/viewer).
 *
 * The `scope` comes from `AppLogger#scope()` or, when Nest delegates
 * `new Logger(Context)`, from that context. Unknown scopes fall back to `app`.
 * While a request is in flight, `requestId`/`userId` are attached automatically.
 *
 * All settings come from the `logger` config section (`ConfigService`).
 */
@Injectable()
export class AppLogger implements LoggerService, OnApplicationShutdown {
  private readonly enabled: boolean;
  private readonly stdout: pino.DestinationStream;
  private readonly writers = new Map<string, FileWriter>();
  private readonly combined = new Map<string, FileDestination>();
  private readonly logDirPath: string;
  private readonly level: LogLevel;
  private readonly fileEnabled: boolean;
  private readonly retentionDays: number;
  private readonly service: string;
  private readonly env: string;
  private lastPruneAt = 0;
  private pruning: Promise<void> | null = null;

  constructor(config: ConfigService) {
    this.enabled = config.get<boolean>('logger.enabled') ?? true;
    this.logDirPath = config.get<string>('logger.dir') ?? join(process.cwd(), 'logs');
    this.level = (config.get<string>('logger.level') ?? 'info') as LogLevel;
    this.fileEnabled = config.get<boolean>('logger.fileEnabled') ?? true;
    this.retentionDays = config.get<number>('logger.retentionDays') ?? 14;
    this.service = config.get<string>('logger.serviceName') ?? 'lio-back';
    this.env = config.get<string>('logger.env') ?? 'development';
    this.stdout = pino.destination({ dest: 1, sync: false });
  }

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
   * Write one entry to stdout (and, when enabled, to the combined file and the
   * scope file).
   *
   * @returns the absolute path of the scope file (or the combined file).
   */
  write(scope: string, level: LogLevel, message: unknown, meta: Record<string, unknown> = {}): string {
    if (!this.enabled) return '';

    const now = new Date();
    const name = this.normalizeScope(scope);
    const entry = this.buildEntry(name, message, meta);
    const writer = this.writerFor(name, now);

    writer.logger[level](entry);
    this.maybePrune(now.getTime());
    return writer.file;
  }

  /** Flushes every sink. */
  flush(): void {
    if (!this.enabled) return;

    (this.stdout as { flushSync?: () => void }).flushSync?.();
    for (const writer of this.writers.values()) {
      for (const destination of writer.destinations) destination.flushSync?.();
    }
    for (const destination of this.combined.values()) destination.flushSync?.();
  }

  onApplicationShutdown(): void {
    this.flush();
  }

  // --- internals -----------------------------------------------------------

  private pinoOptions(): pino.LoggerOptions {
    return {
      level: this.level,
      messageKey: 'message',
      timestamp: pino.stdTimeFunctions.isoTime,
      base: { service: this.service, env: this.env, pid: process.pid, hostname: SERVICE_HOSTNAME },
      formatters: { level: (label, number) => ({ level: label, levelNumber: number }) },
      redact: { paths: LOG_REDACT_PATHS, censor: '[redacted]' },
      mixin: () => this.requestFields(),
    };
  }

  /** Attaches the current request's correlation fields, if any. */
  private requestFields(): Record<string, unknown> {
    const ctx = requestContext.getStore();
    if (!ctx) return {};
    return ctx.userId != null ? { requestId: ctx.requestId, userId: ctx.userId } : { requestId: ctx.requestId };
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

    const streams: pino.DestinationStream[] = [this.stdout];
    const destinations: FileDestination[] = [];

    const combined = this.combinedDestination(date);
    if (combined) streams.push(combined);

    const file = join(this.logDirPath, scope, `${date}.log`);
    if (this.fileEnabled && scope !== COMBINED_SCOPE) {
      const scopeDestination = pino.destination({ dest: file, mkdir: true, sync: true });
      destinations.push(scopeDestination);
      streams.push(scopeDestination);
    }

    const logger = pino(this.pinoOptions(), pino.multistream(streams));
    const writer: FileWriter = { file, logger, destinations };
    this.writers.set(key, writer);

    // Drop the previous day's writer for this scope so file handles stay bounded.
    for (const [otherKey, other] of this.writers) {
      if (otherKey !== key && otherKey.startsWith(`${scope}:`)) {
        for (const destination of other.destinations) {
          destination.flushSync?.();
          destination.end();
        }
        this.writers.delete(otherKey);
      }
    }

    return writer;
  }

  private combinedDestination(date: string): FileDestination | null {
    if (!this.fileEnabled) return null;

    const cached = this.combined.get(date);
    if (cached) return cached;

    const destination = pino.destination({ dest: join(this.logDirPath, COMBINED_SCOPE, `${date}.log`), mkdir: true, sync: true });
    this.combined.set(date, destination);

    for (const [otherDate, other] of this.combined) {
      if (otherDate !== date) {
        other.flushSync?.();
        other.end();
        this.combined.delete(otherDate);
      }
    }

    return destination;
  }

  private normalizeScope(scope: string | undefined): string {
    const name = (scope ?? DEFAULT_SCOPE).trim().toLowerCase();
    return SCOPE_RE.test(name) ? name : DEFAULT_SCOPE;
  }

  /**
   * Nest delegates `new Logger(Context)` calls to these methods with the context
   * as the trailing argument. Framework logs always land in `app`; the context
   * is kept as a field. Services that want their own scope call `scope()`.
   */
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
    if (strings.length) {
      meta.context = strings[strings.length - 1];
    }
    if (strings.length > 1) {
      meta.stack = strings.slice(0, -1).join('\n');
    }
    return { scope: DEFAULT_SCOPE, meta };
  }

  /** Runs the day-based retention lazily, at most once per interval. */
  private maybePrune(nowMs: number): void {
    if (!this.fileEnabled || this.retentionDays <= 0 || this.pruning) return;
    if (nowMs - this.lastPruneAt < LOG_PRUNE_INTERVAL_MS) return;

    this.lastPruneAt = nowMs;
    this.pruning = this.prune(nowMs)
      .catch(() => undefined)
      .finally(() => {
        this.pruning = null;
      });
  }

  /** Deletes `logs/<scope>/<date>.log` files older than `logger.retentionDays`. */
  private async prune(nowMs: number): Promise<void> {
    const cutoff = DateTime.fromMillis(nowMs).minus({ days: this.retentionDays }).toFormat('yyyy-MM-dd');
    const entries = await readdir(this.logDirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = join(this.logDirPath, entry.name);
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
