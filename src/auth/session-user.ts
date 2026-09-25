import type { Request } from 'express';
import type { SessionTransport } from './utils/extract-session-credential';

// Shape attached to `request.user` by the session guards. Kept compatible with
// the former JWT payload so existing consumers (PermissionsGuard, cart, auth
// controller) keep working unchanged.
export interface SessionUser {
  userId: number;
  username: string;
  sessionId: string;
}

export interface SessionRequest extends Request {
  user?: SessionUser;
  authVia?: SessionTransport;
}

export function attachSessionUser(req: Request, user: SessionUser, via: SessionTransport): void {
  const sessionRequest = req as SessionRequest;
  sessionRequest.user = user;
  sessionRequest.authVia = via;
}
