import { PartialType } from '@nestjs/swagger';
import { CreatePermissionRequestDto } from '../createPermission/create-permission-request.dto';

export class UpdatePermissionRequestDto extends PartialType(CreatePermissionRequestDto) {}
