import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCookieAuth, ApiHeader, ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/otp.service';
import { SmsService } from 'src/sms/sms.service';
import { SessionService } from './services/session.service';
import type { AuthUser } from './services/session.service';
import { CsrfService } from './services/csrf.service';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import { AuthorizationService } from 'src/authorization/services/authorization.service';
import { ADMIN_PANEL_VIEW_PERMISSION } from 'src/authorization/authorization.constants';
import { PasswordService } from './services/password.service';
import { UsersService } from 'src/users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { OptionalSessionAuthGuard } from './guards/optional-session-auth.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { DevAuthGuard } from './guards/dev-auth.guard';
import { Public } from './decorators/public.decorator';
import type { SessionUser } from './session-user';
import { OtpPurpose, UserStatus } from 'src/database/schema';
import { RequestOtpRequestDto } from './dtos/requestOtp/request-otp-request.dto';
import { RequestOtpResponseDto } from './dtos/requestOtp/request-otp-response.dto';
import { VerifyOtpRequestDto } from './dtos/verifyOtp/verify-otp-request.dto';
import { VerifyOtpResponseDto } from './dtos/verifyOtp/verify-otp-response.dto';
import { IssueCsrfResponseDto } from './dtos/issueCsrf/issue-csrf-response.dto';
import { LoginRequestDto } from './dtos/login/login-request.dto';
import { LoginResponseDto } from './dtos/login/login-response.dto';
import { LogoutResponseDto } from './dtos/logout/logout-response.dto';
import { MeResponseDto } from './dtos/me/me-response.dto';
import { ChangePasswordRequestDto } from './dtos/changePassword/change-password-request.dto';
import { ChangePasswordResponseDto } from './dtos/changePassword/change-password-response.dto';
import { HashPasswordRequestDto } from './dtos/hashPassword/hash-password-request.dto';
import { HashPasswordResponseDto } from './dtos/hashPassword/hash-password-response.dto';
import { DevLoginRequestDto } from './dtos/devLogin/dev-login-request.dto';
import { DevLoginResponseDto } from './dtos/devLogin/dev-login-response.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly otp: OtpService,
    private readonly sms: SmsService,
    private readonly sessions: SessionService,
    private readonly csrfService: CsrfService,
    private readonly authorization: AuthorizationService,
    private readonly passwords: PasswordService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Issue a CSRF token' })
  @ApiOkResponse({
    description: 'CSRF token issued',
    type: IssueCsrfResponseDto,
  })
  @Public()
  @Get('csrf')
  issueCsrf(@Res({ passthrough: true }) res: Response): IssueCsrfResponseDto {
    const csrfToken = this.csrfService.generateCsrfToken(res);
    return { ok: true, csrfToken };
  }

  @ApiOperation({ summary: 'Request an OTP for login' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: RequestOtpRequestDto })
  @ApiOkResponse({ description: 'OTP sent', type: RequestOtpResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid phone number' })
  @ApiServiceUnavailableResponse({ description: 'The OTP was created but the SMS provider failed to send it' })
  @Public()
  @UseGuards(CsrfGuard)
  @HttpCode(HttpStatus.OK)
  @Post('otp/request')
  async requestOtp(@Body() body: RequestOtpRequestDto): Promise<RequestOtpResponseDto> {
    const username = this.normalizeUsername(body.username);
    const code = await this.otp.request(username, OtpPurpose.LOGIN);

    const sms = await this.sms.sendOtp(username, code);
    if (!sms.ok) {
      if (this.sms.enabled) {
        // SMS is on but the provider rejected the send; let the client retry.
        this.logger.error(`Failed to send OTP SMS to ${username}: ${sms.error}`);
        throw new ServiceUnavailableException('Could not send the OTP SMS');
      }
      // SMS disabled (local/dev): log the code so the login flow can be completed.
      this.logger.warn(`SMS disabled; OTP for ${username}: ${code}`);
    }

    return { ttlSeconds: this.config.getOrThrow<number>('otp.ttlSeconds') };
  }

  @ApiOperation({ summary: 'Verify OTP and establish a session' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: VerifyOtpRequestDto })
  @ApiOkResponse({
    description: 'Authenticated user',
    type: VerifyOtpResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid phone number' })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired OTP, or inactive account',
  })
  @Public()
  @UseGuards(CsrfGuard)
  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  async verifyOtp(@Body() body: VerifyOtpRequestDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<VerifyOtpResponseDto> {
    const username = this.normalizeUsername(body.username);
    const ok = await this.otp.verify(username, OtpPurpose.LOGIN, body.code);
    if (!ok) throw new UnauthorizedException('Invalid or expired OTP');

    const existing = await this.users.findByUsername(username);
    const user = existing ?? (await this.users.createByUsername(username));
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account not active');
    }

    const authUser = await this.sessions.establishSession(user, req, res);
    return { ...authUser, showAdminPanel: await this.canViewAdminPanel(authUser.id) };
  }

  @ApiOperation({ summary: 'Login with username and password' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ description: 'Authenticated user', type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive account',
  })
  @Public()
  @UseGuards(LocalAuthGuard, CsrfGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() _body: LoginRequestDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
    const authUser = await this.sessions.establishSession(req.user as AuthUser, req, res);
    return { ...authUser, showAdminPanel: await this.canViewAdminPanel(authUser.id) };
  }

  @ApiOperation({ summary: 'Revoke the current session and clear the session cookie' })
  @ApiHeader(CSRF_HEADER)
  @ApiCookieAuth('session')
  @ApiOkResponse({ description: 'Logged out', type: LogoutResponseDto })
  @UseGuards(OptionalSessionAuthGuard, CsrfGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LogoutResponseDto> {
    const user = req.user as SessionUser | undefined;
    await this.sessions.logout(user?.sessionId, res);
    return { ok: true };
  }

  @ApiOperation({ summary: 'Change the current user password' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: ChangePasswordRequestDto })
  @ApiCookieAuth('session')
  @ApiOkResponse({ description: 'Password changed', type: ChangePasswordResponseDto })
  @UseGuards(SessionAuthGuard, CsrfGuard)
  @HttpCode(HttpStatus.OK)
  @Post('password')
  async changePassword(@Body() body: ChangePasswordRequestDto, @Req() req: Request): Promise<ChangePasswordResponseDto> {
    const user = req.user as SessionUser;
    await this.auth.changePassword(user.userId, body.newPassword, user.sessionId);
    return { ok: true };
  }

  @ApiOperation({
    summary: 'Return the current authenticated user (or anonymous status)',
  })
  @ApiCookieAuth('session')
  @ApiOkResponse({
    description: 'Authentication status and user',
    type: MeResponseDto,
  })
  @UseGuards(OptionalSessionAuthGuard)
  @Get('me')
  async me(@Req() req: Request): Promise<MeResponseDto> {
    const user = req.user as SessionUser | undefined;
    if (!user) {
      return { authenticated: false, user: null, loading: false, showAdminPanel: false };
    }
    return {
      authenticated: true,
      user: { id: user.userId, username: user.username },
      loading: false,
      showAdminPanel: await this.canViewAdminPanel(user.userId),
    };
  }

  @ApiOperation({
    summary: 'Dev only: establish a session and return a CSRF token in one call (requires DEV_AUTH=true)',
  })
  @ApiBody({ type: DevLoginRequestDto })
  @ApiOkResponse({
    description: 'Session established and CSRF token issued',
    type: DevLoginResponseDto,
  })
  @Public()
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('dev/login')
  async devLogin(@Body() body: DevLoginRequestDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<DevLoginResponseDto> {
    const username = this.normalizeUsername(body.username);
    const existing = await this.users.findByUsername(username);
    const user = existing ?? (await this.users.createByUsername(username));

    const authUser = await this.sessions.establishSession(user, req, res);
    const csrfToken = this.csrfService.generateCsrfToken(res);

    return { csrfToken, user: authUser, showAdminPanel: await this.canViewAdminPanel(authUser.id) };
  }

  @ApiOperation({ summary: 'Hash a plain password (test/dev only)' })
  @ApiBody({ type: HashPasswordRequestDto })
  @ApiOkResponse({ description: 'Hashed password', type: HashPasswordResponseDto })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('test/hash-password')
  async hashPassword(@Body() body: HashPasswordRequestDto): Promise<HashPasswordResponseDto> {
    const hash = await this.passwords.hash(body.password);
    return { hash };
  }

  private canViewAdminPanel(userId: number): Promise<boolean> {
    return this.authorization.hasPermission(userId, ADMIN_PANEL_VIEW_PERMISSION);
  }

  private normalizeUsername(username: string): string {
    const PHONE_RE = /^09\d{9}$/;
    const p = (username ?? '').trim();
    if (!PHONE_RE.test(p)) {
      throw new BadRequestException('Invalid phone number');
    }
    return p;
  }
}
