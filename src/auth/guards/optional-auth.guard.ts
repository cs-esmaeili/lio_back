import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Authenticates when a valid token is present, otherwise passes through
// unauthenticated (req.user stays undefined). Used by the /auth/me endpoint.
@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        return true;
      }
      throw err;
    }
  }
}
