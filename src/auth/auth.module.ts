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
import { SessionAuthGuard } from './guards/session-auth.guard';
import { OptionalSessionAuthGuard } from './guards/optional-session-auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { DevAuthGuard } from './guards/dev-auth.guard';
import { CsrfService } from './services/csrf.service';
import { AuthController } from './auth.controller';
import { SmsModule } from 'src/sms/sms.module';
import { AuthorizationAccessModule } from 'src/authorization/authorization-access.module';

@Module({
  controllers: [AuthController],
  imports: [UsersModule, SmsModule, PassportModule, AuthorizationAccessModule],
  providers: [
    AuthService,
    PasswordService,
    OtpService,
    TokenService,
    SessionService,
    CookieService,
    CsrfService,
    LocalStrategy,
    SessionAuthGuard,
    OptionalSessionAuthGuard,
    CsrfGuard,
    DevAuthGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    OtpService,
    TokenService,
    SessionService,
    CookieService,
    CsrfService,
    SessionAuthGuard,
    OptionalSessionAuthGuard,
    CsrfGuard,
    DevAuthGuard,
  ],
})
export class AuthModule {}
