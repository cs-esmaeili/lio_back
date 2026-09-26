import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { LocationController } from './location.controller';
import { LocationService } from './services/location.service';
import { LocationRepository } from './repositories/location.repository';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [LocationController],
  providers: [LocationRepository, LocationService],
  exports: [LocationService],
})
export class LocationModule {}
