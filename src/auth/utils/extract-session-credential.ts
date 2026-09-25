import type { Request } from 'express';

export type SessionTransport = 'cookie' | 'bearer';

export interface SessionCredential {
  raw: string;
  via: SessionTransport;
}

// A session credential can arrive either as the HttpOnly web cookie or as a
// Bearer token (mobile/API clients). Both resolve to the same session store.
export function extractSessionCredential(req: Request, cookieName: string): SessionCredential | null {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const cookieToken = cookies?.[cookieName];
  if (cookieToken) {
    return { raw: cookieToken, via: 'cookie' };
  }

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const raw = header.slice('Bearer '.length).trim();
    if (raw) {
      return { raw, via: 'bearer' };
    }
  }

  return null;
}
