import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthorizationService } from '../services/authorization.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest<{ user?: { userId?: number } }>().user;
    if (!user?.userId) {
      throw new ForbiddenException();
    }

    const granted = await this.authorization.getUserPermissions(user.userId);
    if (!required.every((permission) => granted.has(permission))) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
