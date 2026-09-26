import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { finalize, type Observable } from 'rxjs';
import { LOG_REQUESTS } from '../logger.constants';
import { AppLogger, type ScopedLogger } from '../logger.service';

/**
 * Logs one line per HTTP request, gated by `LOG_REQUESTS` (`all` | `errors` | `off`).
 * Only metadata is logged; request/response bodies are never touched.
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger: ScopedLogger;

  constructor(appLogger: AppLogger) {
    this.logger = appLogger.scope('http');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (LOG_REQUESTS === 'off') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const status = res.statusCode;
        if (LOG_REQUESTS === 'errors' && status < 400) return;

        const path = req.originalUrl ?? req.url;
        const meta = { method: req.method, path, status, durationMs: Date.now() - startedAt };
        const message = `${req.method} ${path} ${status}`;

        if (status >= 500) this.logger.error(message, meta);
        else if (status >= 400) this.logger.warn(message, meta);
        else this.logger.info(message, meta);
      }),
    );
  }
}
