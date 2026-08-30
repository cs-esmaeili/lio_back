import { BadRequestException, Body, Controller, Get, Logger, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCookieAuth, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { OtpService } from './services/otp.service';
import { SessionService } from './services/session.service';
import type { AuthUser } from './services/session.service';
import { CsrfService } from './services/csrf.service';
import { UsersService } from 'src/users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
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

interface JwtUser {
  userId: number;
  username: string;
  sessionId: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly otp: OtpService,
    private readonly sessions: SessionService,
    private readonly csrfService: CsrfService,
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
  @ApiCookieAuth('access_token')
  @ApiOkResponse({ description: 'Logged out', type: LogoutResponseDto })
  @UseGuards(OptionalAuthGuard, CsrfGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LogoutResponseDto> {
    const user = req.user as JwtUser | undefined;
    await this.sessions.logout(user?.sessionId, res);
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

  private normalizeUsername(username: string): string {
    const PHONE_RE = /^09\d{9}$/;
    const p = (username ?? '').trim();
    if (!PHONE_RE.test(p)) {
      throw new BadRequestException('Invalid phone number');
    }
    return p;
  }
}
