import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSectionRequestDto } from '../createSection/create-section-request.dto';

export class UpdateSectionRequestDto extends PartialType(OmitType(CreateSectionRequestDto, ['pageId', 'type'] as const)) {}
