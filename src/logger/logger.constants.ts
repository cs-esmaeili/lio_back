import { join } from 'node:path';

/** Levels `AppLogger` can emit (pino names). */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

/** Numeric values kept in sync with the level labels (used in the log line). */
export const LOG_LEVEL_NUMBERS: Record<LogLevel, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

/** Scope that mirrors every entry, whatever its own scope is. */
export const COMBINED_SCOPE = 'combined';

/** Scope used when a logger has no explicit scope (Nest's own logs, etc.). */
export const DEFAULT_SCOPE = 'app';

/** A scope maps to one directory under the log dir, so it must be a safe name. */
export const SCOPE_RE = /^[a-z0-9-]+$/;

/** Base directory for log files. Overridable with `LOG_DIR`. */
export const DEFAULT_LOG_DIR = process.env.LOG_DIR ?? join(process.cwd(), 'logs');

/** Minimum level pino writes. Use `debug` in dev to keep debug entries. */
export const DEFAULT_LOG_LEVEL: LogLevel = (LOG_LEVELS as readonly string[]).includes(process.env.LOG_LEVEL ?? '') ? (process.env.LOG_LEVEL as LogLevel) : 'info';

/** Log files older than this many days are pruned. `0` disables retention. */
export const LOG_RETENTION_DAYS = Math.max(0, Number.parseInt(process.env.LOG_RETENTION_DAYS ?? '14', 10) || 0);

/** How often the lazy prune may run, triggered from the write path. */
export const LOG_PRUNE_INTERVAL_MS = 60 * 60 * 1000;

/** Fields redacted from every entry before it is written. */
export const LOG_REDACT_PATHS = [
  'password',
  '*.password',
  'currentPassword',
  'newPassword',
  'token',
  '*.token',
  'otp',
  '*.otp',
  'authorization',
  '*.authorization',
  'cookie',
  '*.cookie',
  'apiKey',
  '*.apiKey',
  'sessionId',
  '*.sessionId',
];
