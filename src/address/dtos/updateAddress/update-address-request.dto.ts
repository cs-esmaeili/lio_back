import { PartialType } from '@nestjs/swagger';
import { CreateAddressRequestDto } from '../createAddress/create-address-request.dto';

export class UpdateAddressRequestDto extends PartialType(CreateAddressRequestDto) {}
