import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { OtpService } from './services/otp.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { CookieService } from './services/cookie.service';
import { CsrfService } from './services/csrf.service';
import { UsersService } from 'src/users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { Public } from './decorators/public.decorator';
import type { LoginDto } from './dtos/auth.dto';
import { OtpPurpose, UserStatus } from 'src/generated/prisma/client';
import type { OtpRequestDto } from './dtos/requestOtp/otp-request-request.dto';
import { OtpRequestResponseDto } from './dtos/requestOtp/otp-request-response.dto';
import { VerifyOtpRequestDto } from './dtos/verifyOtp/verify-otp-request.dto';
import { VerifyOtpResponseDto } from './dtos/verifyOtp/verify-otp-response.dto';

interface JwtUser {
  userId: number;
  phone: string;
  sessionId: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly otp: OtpService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    private readonly cookies: CookieService,
    private readonly csrfService: CsrfService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('csrf')
  issueCsrf(@Res({ passthrough: true }) res: Response) {
    const csrfToken = this.csrfService.generateCsrfToken(res);
    return { ok: true, csrfToken };
  }

  @Public()
  @UseGuards(CsrfGuard)
  @Post('otp/request')
  async requestOtp(@Body() otpRequestDto: OtpRequestDto): Promise<OtpRequestResponseDto> {
    const phone = this.normalizePhone(otpRequestDto.phone);
    const code = await this.otp.request(phone, OtpPurpose.LOGIN);

    // Dev delivery: no SMS yet. Log only, never in response body.
    this.logger.log(`OTP for ${phone}: ${code}`);

    return { ttlSeconds: this.config.getOrThrow<number>('otp.ttlSeconds') };
  }

  @Public()
  @UseGuards(CsrfGuard)
  @Post('otp/verify')
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
  async verifyOtp(
    @Body() body: VerifyOtpRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<VerifyOtpResponseDto> {
    const phone = this.normalizePhone(body.phone);
    const ok = await this.otp.verify(phone, OtpPurpose.LOGIN, body.code);
    if (!ok) throw new UnauthorizedException('Invalid or expired OTP');

    const existing = await this.users.findByPhone(phone);
    const user = existing ?? (await this.users.createByPhone(phone));
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account not active');
    }

    return this.establishSession(user, req, res);
  }

  //   @Public()
  //   @UseGuards(LocalAuthGuard, CsrfGuard)
  //   @Post('login')
  //   async login(
  //     @Body() _body: LoginDto,
  //     @Req() req: Request,
  //     @Res({ passthrough: true }) res: Response,
  //   ) {
  //     return this.establishSession(req.user, req, res);
  //   }

  //   @Public()
  //   @UseGuards(CsrfGuard)
  //   @Post('refresh')
  //   async refresh(
  //     @Req() req: Request,
  //     @Res({ passthrough: true }) res: Response,
  //   ) {
  //     const raw = req.cookies?.[this.cookies.refreshTokenName()];
  //     if (!raw) throw new UnauthorizedException('No refresh token');

  //     const session = await this.sessions.findByRefreshHash(
  //       this.tokens.hashRefreshToken(raw),
  //     );
  //     if (!session) throw new UnauthorizedException('Invalid refresh token');

  //     const user = await this.users.findById(session.userId);
  //     if (!user || user.status !== UserStatus.ACTIVE) {
  //       await this.sessions.revokeAllForUser(session.userId);
  //       throw new UnauthorizedException('Account not active');
  //     }

  //     const next = this.tokens.generateRefreshToken();
  //     const newSession = await this.sessions.rotate(
  //       session,
  //       next.hash,
  //       req.ip,
  //       req.get('user-agent'),
  //     );

  //     const accessToken = this.tokens.signAccessToken({
  //       sub: String(user.id),
  //       sid: newSession.id,
  //       jti: this.tokens.newJti(),
  //     });
  //     this.cookies.setAccessToken(res, accessToken);
  //     this.cookies.setRefreshToken(res, next.raw);
  //     this.csrf.issueToken(res);

  //     return this.publicUser(user);
  //   }

  //   @UseGuards(OptionalAuthGuard, CsrfGuard)
  //   @Post('logout')
  //   async logout(
  //     @Req() req: Request,
  //     @Res({ passthrough: true }) res: Response,
  //   ) {
  //     const user = req.user as JwtUser | undefined;
  //     if (user) {
  //       await this.sessions.revokeOne(user.sessionId);
  //     }
  //     this.cookies.clearAuthCookies(res);
  //     return { ok: true };
  //   }

  //   @UseGuards(OptionalAuthGuard)
  //   @Get('me')
  //   async me(@Req() req: Request) {
  //     const user = req.user as JwtUser | undefined;
  //     if (!user) {
  //       return { authenticated: false, user: null, loading: false };
  //     }
  //     return {
  //       authenticated: true,
  //       user: { id: user.userId, phone: user.phone },
  //       loading: false,
  //     };
  //   }

  //   private async establishSession(user: any, req: Request, res: Response) {
  //     const { raw, hash } = this.tokens.generateRefreshToken();
  //     const session = await this.sessions.create({
  //       userId: user.id,
  //       refreshTokenHash: hash,
  //       ip: req.ip,
  //       userAgent: req.get('user-agent'),
  //     });

  //     const accessToken = this.tokens.signAccessToken({
  //       sub: String(user.id),
  //       sid: session.id,
  //       jti: this.tokens.newJti(),
  //     });
  //     this.cookies.setAccessToken(res, accessToken);
  //     this.cookies.setRefreshToken(res, raw);
  //     this.csrf.issueToken(res); // fresh CSRF per session (anti-fixation)

  //     return this.publicUser(user);
  //   }

  //   private publicUser(user: any) {
  //     return {
  //       id: user.id,
  //       phone: user.phone,
  //       name: user.name,
  //       lastName: user.lastName,
  //       username: user.username,
  //     };
  //   }

  private normalizePhone(phone: string): string {
    const PHONE_RE = /^09\d{9}$/;
    const p = (phone ?? '').trim();
    if (!PHONE_RE.test(p)) {
      throw new BadRequestException('Invalid phone number');
    }
    return p;
  }
}
