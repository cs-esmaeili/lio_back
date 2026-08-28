import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieService } from '../services/cookie.service';
import { SessionService } from '../services/session.service';
import { UsersService } from 'src/users/users.service';
import { UserStatus } from 'src/generated/prisma/client';

interface JwtPayload {
  sub: string;
  sid: string;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    cookieService: CookieService,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.[cookieService.accessTokenName()] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.publicKey'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload) {
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId)) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    const session = await this.sessionService.findById(payload.sid);
    if (!session || !this.sessionService.isActive(session)) {
      throw new UnauthorizedException();
    }

    return { userId: user.id, phone: user.phone, sessionId: session.id };
  }
}
