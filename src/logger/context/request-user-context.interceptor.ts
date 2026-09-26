import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { requestContext } from './request-context';

/**
 * Adds the authenticated `userId` to the request log context once the guards
 * have run, so entries written by services carry it without threading it around.
 */
@Injectable()
export class RequestUserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: { userId?: number } }>();
    const store = requestContext.getStore();
    const userId = req.user?.userId;

    if (store && userId != null) {
      store.userId = userId;
    }
    return next.handle();
  }
}
