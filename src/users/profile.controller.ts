import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCookieAuth, ApiHeader, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import type { SessionUser } from 'src/auth/session-user';
import { UsersService } from './users.service';
import { GetProfileResponseDto } from './dtos/getProfile/get-profile-response.dto';
import { UpdateProfileRequestDto } from './dtos/updateProfile/update-profile-request.dto';
import { UpdateProfileResponseDto } from './dtos/updateProfile/update-profile-response.dto';

/**
 * The current user's own profile (`/profile`). The user id is always read from
 * the session, never from the request, so a user can only read or edit their
 * own record. Editing is limited to `name`, `lastName` and `nationalCode`;
 * `username` and addresses are out of scope.
 */
@UseGuards(SessionAuthGuard, CsrfGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({ summary: "Get the authenticated user's profile" })
  @ApiOkResponse({ description: 'The profile of the current user', type: GetProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiCookieAuth('session')
  @Get()
  getProfile(@Req() req: Request): Promise<GetProfileResponseDto> {
    return this.users.getProfile((req.user as SessionUser).userId);
  }

  @ApiOperation({
    summary: "Update the authenticated user's profile (name, lastName, nationalCode)",
  })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: UpdateProfileRequestDto })
  @ApiOkResponse({ description: 'The updated profile of the current user', type: UpdateProfileResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiConflictResponse({ description: 'National code is already in use by another user' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiCookieAuth('session')
  @Patch()
  updateProfile(@Req() req: Request, @Body() body: UpdateProfileRequestDto): Promise<UpdateProfileResponseDto> {
    return this.users.updateProfile((req.user as SessionUser).userId, body);
  }
}
