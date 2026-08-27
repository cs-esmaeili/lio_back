import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadKey(envPath: string | undefined, fallback: string): string {
  const p = join(process.cwd(), envPath ?? fallback);
  return readFileSync(p, 'utf8');
}

export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    origin: process.env.APP_ORIGIN ?? 'http://localhost:3000',
  },
  jwt: {
    privateKey: loadKey(process.env.JWT_PRIVATE_KEY_PATH, 'keys/jwt-private.pem'),
    publicKey: loadKey(process.env.JWT_PUBLIC_KEY_PATH, 'keys/jwt-public.pem'),
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtlDays: parseInt(process.env.JWT_REFRESH_TTL_DAYS ?? '30', 10),
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
  },
});
