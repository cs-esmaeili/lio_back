import { join } from 'node:path';

/** Log channels. Each channel gets its own file per day: `<logsDir>/<channel>/<yyyy-MM-dd>.log`. */
export const LOG_CHANNELS = ['info', 'warn', 'error', 'debug', 'fatal'] as const;

export type LogChannel = (typeof LOG_CHANNELS)[number];

/** Extra channel that mirrors every entry, whatever its own channel is. */
export const COMBINED_CHANNEL = 'combined';

/** Channel used by Nest's `logger.log()` and by the generic `write()` helpers. */
export const DEFAULT_CHANNEL: LogChannel = 'info';

/** Base directory for log files. Overridable with `LOG_DIR`. */
export const DEFAULT_LOG_DIR = process.env.LOG_DIR ?? join(process.cwd(), 'logs');
