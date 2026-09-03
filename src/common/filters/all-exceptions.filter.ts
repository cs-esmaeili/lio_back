import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(this.normalizeHttpException(exception));
      return;
    }

    this.logger.error(exception);
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
