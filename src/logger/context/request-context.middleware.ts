import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { requestContext } from './request-context';

const MAX_REQUEST_ID_LENGTH = 128;

/**
 * Starts the per-request log context. Reuses an incoming `x-request-id` when the
 * caller (gateway/load balancer) provides one, otherwise generates it, and
 * echoes it back on the response.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header('x-request-id');
    const requestId = incoming && incoming.length <= MAX_REQUEST_ID_LENGTH ? incoming : randomUUID();

    res.setHeader('x-request-id', requestId);
    requestContext.run({ requestId }, () => next());
  }
}
