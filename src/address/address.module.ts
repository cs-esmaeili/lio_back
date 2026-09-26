import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AddressController } from './address.controller';
import { AddressService } from './services/address.service';
import { AddressRepository } from './repositories/address.repository';

@Module({
  imports: [AuthModule],
  controllers: [AddressController],
  providers: [AddressRepository, AddressService],
  exports: [AddressService],
})
export class AddressModule {}
