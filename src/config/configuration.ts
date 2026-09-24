import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadKey(envPath: string | undefined, fallback: string): string {
  const p = join(process.cwd(), envPath ?? fallback);
  return readFileSync(p, 'utf8');
}

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
    jwt: {
      privateKey: loadKey(process.env.JWT_PRIVATE_KEY_PATH, 'keys/jwt-private.pem'),
      publicKey: loadKey(process.env.JWT_PUBLIC_KEY_PATH, 'keys/jwt-public.pem'),
      accessTtlSeconds: parseInt(process.env.JWT_ACCESS_TTL_SECONDS ?? '900', 10),
      refreshTtlDays: parseInt(process.env.JWT_REFRESH_TTL_DAYS ?? '30', 10),
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
      length: parseInt(process.env.OTP_LENGTH ?? '6', 10),
      maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
      maxRequests: parseInt(process.env.OTP_MAX_REQUESTS ?? '10', 10),
      requestWindowSeconds: parseInt(process.env.OTP_REQUEST_WINDOW_SECONDS ?? '900', 10),
      secret: process.env.OTP_SECRET,
    },
  };
};
