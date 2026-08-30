import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from './decorators/permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthorizationService } from './services/authorization.service';
import { ListRolesResponseDto } from './dtos/listRoles/list-roles-response.dto';
import { GetRoleResponseDto } from './dtos/getRole/get-role-response.dto';
import { CreateRoleRequestDto } from './dtos/createRole/create-role-request.dto';
import { CreateRoleResponseDto } from './dtos/createRole/create-role-response.dto';
import { UpdateRoleRequestDto } from './dtos/updateRole/update-role-request.dto';
import { UpdateRoleResponseDto } from './dtos/updateRole/update-role-response.dto';
import { DeleteRoleResponseDto } from './dtos/deleteRole/delete-role-response.dto';
import { ListPermissionsResponseDto } from './dtos/listPermissions/list-permissions-response.dto';
import { CreatePermissionRequestDto } from './dtos/createPermission/create-permission-request.dto';
import { CreatePermissionResponseDto } from './dtos/createPermission/create-permission-response.dto';
import { UpdatePermissionRequestDto } from './dtos/updatePermission/update-permission-request.dto';
import { UpdatePermissionResponseDto } from './dtos/updatePermission/update-permission-response.dto';
import { DeletePermissionResponseDto } from './dtos/deletePermission/delete-permission-response.dto';
import { AssignRoleRequestDto } from './dtos/assignRole/assign-role-request.dto';
import { AssignRoleResponseDto } from './dtos/assignRole/assign-role-response.dto';

@Controller('admin')
export class AuthorizationController {
  constructor(private readonly authorization: AuthorizationService) {}

  @ApiOperation({ summary: 'List all roles with their permissions' })
  @ApiOkResponse({ description: 'Roles', type: ListRolesResponseDto, isArray: true })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('role:read')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('roles')
  async listRoles(): Promise<ListRolesResponseDto[]> {
    const roles = await this.authorization.listRoles();
    return roles.map((role) => this.toRoleDto(role));
  }

  @ApiOperation({ summary: 'Get a single role by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Role', type: GetRoleResponseDto })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('role:read')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('roles/:id')
  async getRole(@Param('id', ParseIntPipe) id: number): Promise<GetRoleResponseDto> {
    const role = await this.authorization.getRole(id);
    return this.toRoleDto(role);
  }

  @ApiOperation({ summary: 'Create a role' })
  @ApiBody({ type: CreateRoleRequestDto })
  @ApiCreatedResponse({ description: 'Created role', type: CreateRoleResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('role:write')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('roles')
  async createRole(@Body() body: CreateRoleRequestDto): Promise<CreateRoleResponseDto> {
    const role = await this.authorization.createRole(body);
    return this.toRoleDto(role);
  }

  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateRoleRequestDto })
  @ApiOkResponse({ description: 'Updated role', type: UpdateRoleResponseDto })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('role:write')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch('roles/:id')
  async updateRole(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateRoleRequestDto): Promise<UpdateRoleResponseDto> {
    const role = await this.authorization.updateRole(id, body);
    return this.toRoleDto(role);
  }

  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Role deleted', type: DeleteRoleResponseDto })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('role:write')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete('roles/:id')
  deleteRole(@Param('id', ParseIntPipe) id: number): Promise<DeleteRoleResponseDto> {
    return this.authorization.deleteRole(id);
  }

  @ApiOperation({ summary: 'List all permissions' })
  @ApiOkResponse({ description: 'Permissions', type: ListPermissionsResponseDto, isArray: true })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('permission:read')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('permissions')
  async listPermissions(): Promise<ListPermissionsResponseDto[]> {
    const permissions = await this.authorization.listPermissions();
    return permissions.map((permission) => this.toPermissionDto(permission));
  }

  @ApiOperation({ summary: 'Create a permission' })
  @ApiBody({ type: CreatePermissionRequestDto })
  @ApiCreatedResponse({ description: 'Created permission', type: CreatePermissionResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('permission:write')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('permissions')
  async createPermission(@Body() body: CreatePermissionRequestDto): Promise<CreatePermissionResponseDto> {
    const permission = await this.authorization.createPermission(body);
    return this.toPermissionDto(permission);
  }

  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdatePermissionRequestDto })
  @ApiOkResponse({ description: 'Updated permission', type: UpdatePermissionResponseDto })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('permission:write')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch('permissions/:id')
  async updatePermission(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePermissionRequestDto): Promise<UpdatePermissionResponseDto> {
    const permission = await this.authorization.updatePermission(id, body);
    return this.toPermissionDto(permission);
  }

  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Permission deleted', type: DeletePermissionResponseDto })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('permission:write')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete('permissions/:id')
  deletePermission(@Param('id', ParseIntPipe) id: number): Promise<DeletePermissionResponseDto> {
    return this.authorization.deletePermission(id);
  }

  @ApiOperation({ summary: 'Assign or remove a role on a user' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiBody({ type: AssignRoleRequestDto })
  @ApiOkResponse({ description: 'Role assigned', type: AssignRoleResponseDto })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiCookieAuth('access_token')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('user:role:manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch('users/:userId/role')
  assignRole(@Param('userId', ParseIntPipe) userId: number, @Body() body: AssignRoleRequestDto): Promise<AssignRoleResponseDto> {
    return this.authorization.assignRole(userId, body.roleId);
  }

  private toPermissionDto(permission: { id: number; name: string; description: string | null }) {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
    };
  }

  private toRoleDto(role: { id: number; name: string; description: string | null; permissions: Array<{ permission: { id: number; name: string; description: string | null } }> }) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((link) => ({
        id: link.permission.id,
        name: link.permission.name,
        description: link.permission.description,
      })),
    };
  }
}
