import { join } from 'node:path';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'] as const;
const LOG_REQUESTS_MODES = ['all', 'errors', 'off'] as const;

export default () => {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const origins = (process.env.APP_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    app: {
      port,
      // Comma-separated allow-list for the CSRF origin check. A single `*`
      // disables the check (dev only); double-submit CSRF still applies.
      origins,
      // First concrete origin, used to build absolute file URLs. `*` is not a
      // usable URL, so fall back to the local server origin.
      origin: origins.find((value) => value !== '*') ?? `http://localhost:${port}`,
    },
    uploads: {
      publicDir: join(process.cwd(), 'public'),
      uploadsDir: process.env.UPLOADS_DIR ?? join(process.cwd(), 'public', 'uploads'),
      urlPrefix: process.env.UPLOADS_URL_PREFIX ?? '/uploads/',
    },
    session: {
      // Sliding lifetime: extended whenever the session is used.
      ttlDays: parseInt(process.env.SESSION_TTL_DAYS ?? '30', 10),
      // Absolute lifetime: hard cap measured from the session's creation.
      absoluteDays: parseInt(process.env.SESSION_ABSOLUTE_DAYS ?? '90', 10),
    },
    devAuth: {
      enabled: process.env.DEV_AUTH === 'true',
    },
    cookie: {
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as 'lax' | 'strict' | 'none',
      domain: process.env.COOKIE_DOMAIN,
    },
    otp: {
      ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '120', 10),
      length: parseInt(process.env.OTP_LENGTH ?? '4', 10),
      maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
      maxRequests: parseInt(process.env.OTP_MAX_REQUESTS ?? '10', 10),
      requestWindowSeconds: parseInt(process.env.OTP_REQUEST_WINDOW_SECONDS ?? '900', 10),
      secret: process.env.OTP_SECRET,
    },
    sms: {
      // When false, sends are skipped and logged instead of hitting the provider.
      enabled: process.env.SMS_ENABLED !== 'false',
      // Active backend, selected in SmsModule.
      provider: process.env.SMS_PROVIDER ?? 'kavenegar',
      // Logical template -> provider template name. Keep provider names in env.
      templates: {
        otp: process.env.KAVENEGAR_OTP_TEMPLATE ?? 'reqOTP',
        orderPaid: process.env.KAVENEGAR_ORDER_PAID_TEMPLATE ?? 'cartPaid',
      },
      kavenegar: {
        apiKey: process.env.KAVENEGAR_API_KEY,
        baseUrl: process.env.KAVENEGAR_BASE_URL ?? 'https://api.kavenegar.com',
      },
    },
    logger: {
      // Master switch for the custom structured logger.
      enabled: process.env.LOG_ENABLED !== 'false',
      // Logical service name attached to every entry (Loki label).
      serviceName: process.env.SERVICE_NAME ?? 'lio-back',
      // Deployment environment attached to every entry.
      env: process.env.NODE_ENV ?? 'development',
      // Base directory for the optional file sink.
      dir: process.env.LOG_DIR ?? join(process.cwd(), 'logs'),
      // Minimum level written: debug | info | warn | error | fatal.
      level: (LOG_LEVELS as readonly string[]).includes(process.env.LOG_LEVEL ?? '') ? process.env.LOG_LEVEL : 'info',
      // Also write entries to files under `dir` (stdout is always on).
      fileEnabled: process.env.LOG_FILE_ENABLED !== 'false',
      // Delete log files older than this many days. 0 disables retention.
      retentionDays: Math.max(0, parseInt(process.env.LOG_RETENTION_DAYS ?? '14', 10) || 0),
      // Per-request access logging: all | errors | off.
      requests: (LOG_REQUESTS_MODES as readonly string[]).includes(process.env.LOG_REQUESTS ?? '') ? process.env.LOG_REQUESTS : 'errors',
    },
  };
};
