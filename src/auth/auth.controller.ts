import { BadRequestException, Body, Controller, Get, Logger, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCookieAuth, ApiHeader, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/otp.service';
import { SessionService } from './services/session.service';
import type { AuthUser } from './services/session.service';
import { CsrfService } from './services/csrf.service';
import { PasswordService } from './services/password.service';
import { UsersService } from 'src/users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { Public } from './decorators/public.decorator';
import { OtpPurpose, UserStatus } from 'src/generated/prisma/client';
import { RequestOtpRequestDto } from './dtos/requestOtp/request-otp-request.dto';
import { RequestOtpResponseDto } from './dtos/requestOtp/request-otp-response.dto';
import { VerifyOtpRequestDto } from './dtos/verifyOtp/verify-otp-request.dto';
import { VerifyOtpResponseDto } from './dtos/verifyOtp/verify-otp-response.dto';
import { IssueCsrfResponseDto } from './dtos/issueCsrf/issue-csrf-response.dto';
import { LoginRequestDto } from './dtos/login/login-request.dto';
import { LoginResponseDto } from './dtos/login/login-response.dto';
import { RefreshResponseDto } from './dtos/refresh/refresh-response.dto';
import { LogoutResponseDto } from './dtos/logout/logout-response.dto';
import { MeResponseDto } from './dtos/me/me-response.dto';
import { ChangePasswordRequestDto } from './dtos/changePassword/change-password-request.dto';
import { ChangePasswordResponseDto } from './dtos/changePassword/change-password-response.dto';
import { HashPasswordRequestDto } from './dtos/hashPassword/hash-password-request.dto';
import { HashPasswordResponseDto } from './dtos/hashPassword/hash-password-response.dto';

const CSRF_HEADER = {
  name: 'X-CSRF-Token',
  required: true,
  description: 'CSRF token from GET /auth/csrf — copy the csrfToken field into this header.',
};

interface JwtUser {
  userId: number;
  username: string;
  sessionId: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly otp: OtpService,
    private readonly sessions: SessionService,
    private readonly csrfService: CsrfService,
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
  @Public()
  @UseGuards(CsrfGuard)
  @Post('otp/request')
  async requestOtp(@Body() body: RequestOtpRequestDto): Promise<RequestOtpResponseDto> {
    const username = this.normalizeUsername(body.username);
    const code = await this.otp.request(username, OtpPurpose.LOGIN);

    // Dev delivery: no SMS yet. Log only, never in response body.
    this.logger.log(`OTP for ${username}: ${code}`);

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

    return this.sessions.establishSession(user, req, res);
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
  @Post('login')
  async login(@Body() _body: LoginRequestDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
    return this.sessions.establishSession(req.user as AuthUser, req, res);
  }

  @ApiOperation({
    summary: 'Refresh the session using the refresh-token cookie',
  })
  @ApiHeader(CSRF_HEADER)
  @ApiCookieAuth('refresh_token')
  @ApiOkResponse({ description: 'Authenticated user', type: RefreshResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
  })
  @Public()
  @UseGuards(CsrfGuard)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<RefreshResponseDto> {
    return this.sessions.refresh(req, res);
  }

  @ApiOperation({ summary: 'Revoke the current session and clear auth cookies' })
  @ApiHeader(CSRF_HEADER)
  @ApiCookieAuth('access_token')
  @ApiOkResponse({ description: 'Logged out', type: LogoutResponseDto })
  @UseGuards(OptionalAuthGuard, CsrfGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LogoutResponseDto> {
    const user = req.user as JwtUser | undefined;
    await this.sessions.logout(user?.sessionId, res);
    return { ok: true };
  }

  @ApiOperation({ summary: 'Change the current user password' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: ChangePasswordRequestDto })
  @ApiCookieAuth('access_token')
  @ApiOkResponse({ description: 'Password changed', type: ChangePasswordResponseDto })
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @Post('password')
  async changePassword(@Body() body: ChangePasswordRequestDto, @Req() req: Request): Promise<ChangePasswordResponseDto> {
    const user = req.user as JwtUser;
    await this.auth.changePassword(user.userId, body.newPassword, user.sessionId);
    return { ok: true };
  }

  @ApiOperation({
    summary: 'Return the current authenticated user (or anonymous status)',
  })
  @ApiCookieAuth('access_token')
  @ApiOkResponse({
    description: 'Authentication status and user',
    type: MeResponseDto,
  })
  @UseGuards(OptionalAuthGuard)
  @Get('me')
  me(@Req() req: Request): MeResponseDto {
    const user = req.user as JwtUser | undefined;
    if (!user) {
      return { authenticated: false, user: null, loading: false };
    }
    return {
      authenticated: true,
      user: { id: user.userId, username: user.username },
      loading: false,
    };
  }

  @ApiOperation({ summary: 'Hash a plain password (test/dev only)' })
  @ApiBody({ type: HashPasswordRequestDto })
  @ApiOkResponse({ description: 'Hashed password', type: HashPasswordResponseDto })
  @Public()
  @Post('test/hash-password')
  async hashPassword(@Body() body: HashPasswordRequestDto): Promise<HashPasswordResponseDto> {
    const hash = await this.passwords.hash(body.password);
    return { hash };
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
