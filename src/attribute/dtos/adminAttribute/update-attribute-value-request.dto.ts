import { PartialType } from '@nestjs/swagger';
import { CreateAttributeValueRequestDto } from './create-attribute-value-request.dto';

export class UpdateAttributeValueRequestDto extends PartialType(CreateAttributeValueRequestDto) {}
