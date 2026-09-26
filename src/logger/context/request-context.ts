import { AsyncLocalStorage } from 'node:async_hooks';

/** Per-request context attached to every log line written during a request. */
export interface RequestContextStore {
  requestId: string;
  userId?: number;
}

/**
 * Request-scoped storage. The `AppLogger` reads it in its pino `mixin`, so any
 * entry written while a request is in flight automatically carries `requestId`
 * (and `userId` once the request is authenticated).
 */
export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}
