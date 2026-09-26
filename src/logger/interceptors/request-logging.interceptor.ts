import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { finalize, type Observable } from 'rxjs';
import { type LogRequestsMode } from '../logger.constants';
import { AppLogger, type ScopedLogger } from '../logger.service';

/**
 * Logs one line per HTTP request, gated by `logger.requests` (`all` | `errors` | `off`).
 * Only metadata is logged; request/response bodies are never touched.
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger: ScopedLogger;
  private readonly mode: LogRequestsMode;

  constructor(appLogger: AppLogger, config: ConfigService) {
    this.logger = appLogger.scope('http');
    this.mode = (config.get<string>('logger.requests') ?? 'errors') as LogRequestsMode;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (this.mode === 'off') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const status = res.statusCode;
        if (this.mode === 'errors' && status < 400) return;

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
