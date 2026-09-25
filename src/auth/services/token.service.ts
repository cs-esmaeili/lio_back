import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class TokenService {
  // Mint an opaque session token. Only its hash is persisted; the raw value
  // travels in the session cookie (or Bearer header for mobile clients).
  generateSessionToken(): { raw: string; hash: string } {
    const raw = randomBytes(32).toString('base64url');
    return { raw, hash: this.hashSessionToken(raw) };
  }

  hashSessionToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
