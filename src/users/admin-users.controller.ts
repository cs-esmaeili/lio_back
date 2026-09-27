import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCookieAuth, ApiForbiddenResponse, ApiHeader, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { UsersService } from './users.service';
import { ListUsersRequestDto } from './dtos/listUsers/list-users-request.dto';
import { ListUsersResponseDto } from './dtos/listUsers/list-users-response.dto';
import { GetUserResponseDto } from './dtos/getUser/get-user-response.dto';
import { UpdateUserStatusRequestDto } from './dtos/updateUserStatus/update-user-status-request.dto';
import { UpdateUserStatusResponseDto } from './dtos/updateUserStatus/update-user-status-response.dto';

@UseGuards(SessionAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({ summary: 'List users (paginated, searchable by username, name, lastName or nationalCode)' })
  @ApiOkResponse({ description: 'Paginated users', type: ListUsersResponseDto })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('user:read')
  @Get()
  listUsers(@Query() query: ListUsersRequestDto): Promise<ListUsersResponseDto> {
    return this.users.listUsers(query);
  }

  @ApiOperation({ summary: 'Get a single user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'User', type: GetUserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('user:read')
  @Get(':id')
  getUser(@Param('id', ParseIntPipe) id: number): Promise<GetUserResponseDto> {
    return this.users.getUser(id);
  }

  @ApiOperation({ summary: 'Update the status of a user' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateUserStatusRequestDto })
  @ApiOkResponse({ description: 'Updated user', type: UpdateUserStatusResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid status' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('user:manage')
  @Patch(':id/status')
  updateUserStatus(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserStatusRequestDto): Promise<UpdateUserStatusResponseDto> {
    return this.users.updateUserStatus(id, body.status);
  }
}
