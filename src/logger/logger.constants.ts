import { hostname } from 'node:os';

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

/** Scope used when a logger has no explicit scope (Nest's own logs, errors, etc.). */
export const DEFAULT_SCOPE = 'app';

/** A scope maps to one directory under the log dir, so it must be a safe name. */
export const SCOPE_RE = /^[a-z0-9-]+$/;

export const SERVICE_HOSTNAME = hostname();

/** How often the lazy prune may run, triggered from the write path. */
export const LOG_PRUNE_INTERVAL_MS = 60 * 60 * 1000;

/** Request logging mode: `all` every request, `errors` only 4xx/5xx, `off` none. */
export type LogRequestsMode = 'all' | 'errors' | 'off';

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
