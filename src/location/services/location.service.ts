import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LocationRepository } from '../repositories/location.repository';
import type { LocationRow } from '../repositories/location.repository';
import type { ListLocationsResponseDto } from '../dtos/listLocations/list-locations-response.dto';
import type { GetLocationResponseDto } from '../dtos/getLocation/get-location-response.dto';
import type { CreateLocationRequestDto } from '../dtos/createLocation/create-location-request.dto';
import type { CreateLocationResponseDto } from '../dtos/createLocation/create-location-response.dto';
import type { UpdateLocationRequestDto } from '../dtos/updateLocation/update-location-request.dto';
import type { UpdateLocationResponseDto } from '../dtos/updateLocation/update-location-response.dto';
import type { DeleteLocationResponseDto } from '../dtos/deleteLocation/delete-location-response.dto';

@Injectable()
export class LocationService {
  constructor(private readonly repository: LocationRepository) {}

  async listLocations(): Promise<ListLocationsResponseDto[]> {
    const rows = await this.repository.list();
    return rows.map((row) => this.toDto(row));
  }

  async getLocation(id: number): Promise<GetLocationResponseDto> {
    return this.toDto(await this.require(id));
  }

  async createLocation(dto: CreateLocationRequestDto): Promise<CreateLocationResponseDto> {
    const row = await this.repository.create({ province: dto.province, city: dto.city });
    return this.toDto(row);
  }

  async updateLocation(id: number, dto: UpdateLocationRequestDto): Promise<UpdateLocationResponseDto> {
    await this.require(id);
    const row = await this.repository.update(id, { province: dto.province, city: dto.city });
    if (!row) throw new NotFoundException('Location not found');
    return this.toDto(row);
  }

  async deleteLocation(id: number): Promise<DeleteLocationResponseDto> {
    await this.require(id);
    if ((await this.repository.countAddresses(id)) > 0) {
      throw new ConflictException('Location is in use by an address');
    }

    const removed = await this.repository.remove(id);
    if (removed === 0) throw new NotFoundException('Location not found');
    return { ok: true };
  }

  private async require(id: number): Promise<LocationRow> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Location not found');
    return row;
  }

  private toDto(row: LocationRow) {
    return {
      id: row.id,
      province: row.province,
      city: row.city,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
