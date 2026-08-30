import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { CookieService } from './services/cookie.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { CsrfService } from './services/csrf.service';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';
@Module({
  controllers: [AuthController],
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: config.getOrThrow<string>('jwt.privateKey'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: config.getOrThrow<number>('jwt.accessTtlSeconds'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    PasswordService,
    OtpService,
    TokenService,
    SessionService,
    CookieService,
    CsrfService,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    OptionalAuthGuard,
    CsrfGuard,
  ],
  exports: [AuthService, PasswordService, OtpService, TokenService, SessionService, CookieService, CsrfService, JwtAuthGuard, OptionalAuthGuard, CsrfGuard],
})
export class AuthModule {}
