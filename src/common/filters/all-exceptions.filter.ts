import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppLogger } from 'src/logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly appLogger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request & { user?: { userId?: number } }>();
    const response = http.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const statusCode = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const meta = {
      method: request.method,
      path: request.originalUrl ?? request.url,
      status: statusCode,
      userId: request.user?.userId,
      context: AllExceptionsFilter.name,
    };

    // Unexpected errors are `error` (with stack); expected 4xx are `warn`.
    // `requestId` is attached automatically by the logger's request context.
    if (statusCode >= 500 || !isHttp) {
      this.appLogger.scope('app').error(exception, meta);
    } else {
      this.appLogger.scope('app').warn(exception instanceof Error ? exception.message : 'Request rejected', meta);
    }

    if (isHttp) {
      response.status(statusCode).json(this.normalizeHttpException(exception));
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    });
  }

  private normalizeHttpException(exception: HttpException) {
    const statusCode = exception.getStatus();
    const body = exception.getResponse();

    if (typeof body === 'string') {
      return { statusCode, message: body };
    }

    if (typeof body === 'object' && body !== null) {
      const { message, details } = body as {
        message?: string | string[];
        details?: Array<{ field: string; message: string }>;
      };

      if (Array.isArray(details)) {
        return { statusCode, message, details };
      }

      return {
        statusCode,
        message: Array.isArray(message) ? message.join(', ') : (message ?? exception.message),
      };
    }

    return { statusCode, message: exception.message };
  }
}
