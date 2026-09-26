import { PartialType } from '@nestjs/swagger';
import { CreateLocationRequestDto } from '../createLocation/create-location-request.dto';

export class UpdateLocationRequestDto extends PartialType(CreateLocationRequestDto) {}
