import { PartialType } from '@nestjs/swagger';
import { CreateAttributeRequestDto } from './create-attribute-request.dto';

export class UpdateAttributeRequestDto extends PartialType(CreateAttributeRequestDto) {}
