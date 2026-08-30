import { PartialType } from '@nestjs/swagger';
import { CreateRoleRequestDto } from '../createRole/create-role-request.dto';

export class UpdateRoleRequestDto extends PartialType(CreateRoleRequestDto) {}
