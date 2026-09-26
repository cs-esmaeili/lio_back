import { Injectable, NotFoundException } from '@nestjs/common';
import { AddressRepository } from '../repositories/address.repository';
import type { AddressWithLocation } from '../repositories/address.repository';
import type { ListAddressesResponseDto } from '../dtos/listAddresses/list-addresses-response.dto';
import type { GetAddressResponseDto } from '../dtos/getAddress/get-address-response.dto';
import type { CreateAddressRequestDto } from '../dtos/createAddress/create-address-request.dto';
import type { CreateAddressResponseDto } from '../dtos/createAddress/create-address-response.dto';
import type { UpdateAddressRequestDto } from '../dtos/updateAddress/update-address-request.dto';
import type { UpdateAddressResponseDto } from '../dtos/updateAddress/update-address-response.dto';
import type { DeleteAddressResponseDto } from '../dtos/deleteAddress/delete-address-response.dto';
import type { SetMainAddressResponseDto } from '../dtos/setMainAddress/set-main-address-response.dto';

@Injectable()
export class AddressService {
  constructor(private readonly repository: AddressRepository) {}

  async listAddresses(userId: number): Promise<ListAddressesResponseDto[]> {
    const rows = await this.repository.listByUser(userId);
    return rows.map((row) => this.toDto(row));
  }

  async getAddress(userId: number, id: number): Promise<GetAddressResponseDto> {
    return this.toDto(await this.requireOwned(userId, id));
  }

  async createAddress(userId: number, dto: CreateAddressRequestDto): Promise<CreateAddressResponseDto> {
    await this.assertLocation(dto.locationId);

    const row = await this.repository.create(userId, {
      title: dto.title,
      address: dto.address,
      postalCode: dto.postalCode,
      locationId: dto.locationId,
      isMain: dto.isMain ?? false,
    });

    return this.toDto(await this.requireOwned(userId, row.id));
  }

  async updateAddress(userId: number, id: number, dto: UpdateAddressRequestDto): Promise<UpdateAddressResponseDto> {
    await this.requireOwned(userId, id);
    if (dto.locationId !== undefined) {
      await this.assertLocation(dto.locationId);
    }

    await this.repository.update(id, userId, {
      title: dto.title,
      address: dto.address,
      postalCode: dto.postalCode,
      locationId: dto.locationId,
      isMain: dto.isMain,
    });

    return this.toDto(await this.requireOwned(userId, id));
  }

  async deleteAddress(userId: number, id: number): Promise<DeleteAddressResponseDto> {
    const removed = await this.repository.remove(id, userId);
    if (removed === 0) throw new NotFoundException('Address not found');
    return { ok: true };
  }

  async setMainAddress(userId: number, id: number): Promise<SetMainAddressResponseDto> {
    const updated = await this.repository.setMain(id, userId);
    if (!updated) throw new NotFoundException('Address not found');
    return this.toDto(await this.requireOwned(userId, id));
  }

  private async requireOwned(userId: number, id: number): Promise<AddressWithLocation> {
    const row = await this.repository.findByIdForUser(id, userId);
    if (!row) throw new NotFoundException('Address not found');
    return row;
  }

  private async assertLocation(locationId: number): Promise<void> {
    if (!(await this.repository.locationExists(locationId))) {
      throw new NotFoundException('Location not found');
    }
  }

  private toDto(row: AddressWithLocation) {
    return {
      id: row.id,
      title: row.title,
      address: row.address,
      postalCode: row.postalCode,
      isMain: row.isMain,
      locationId: row.locationId,
      location: {
        id: row.location.id,
        province: row.location.province,
        city: row.location.city,
      },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
