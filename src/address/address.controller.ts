import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import type { SessionUser } from 'src/auth/session-user';
import { AddressService } from './services/address.service';
import { ListAddressesResponseDto } from './dtos/listAddresses/list-addresses-response.dto';
import { GetAddressResponseDto } from './dtos/getAddress/get-address-response.dto';
import { CreateAddressRequestDto } from './dtos/createAddress/create-address-request.dto';
import { CreateAddressResponseDto } from './dtos/createAddress/create-address-response.dto';
import { UpdateAddressRequestDto } from './dtos/updateAddress/update-address-request.dto';
import { UpdateAddressResponseDto } from './dtos/updateAddress/update-address-response.dto';
import { DeleteAddressResponseDto } from './dtos/deleteAddress/delete-address-response.dto';
import { SetMainAddressResponseDto } from './dtos/setMainAddress/set-main-address-response.dto';

/**
 * Address endpoints are always scoped to the authenticated user: the owner is
 * read from the session, never from the request body or path.
 */
@UseGuards(SessionAuthGuard, CsrfGuard)
@Controller('addresses')
export class AddressController {
  constructor(private readonly address: AddressService) {}

  @ApiOperation({ summary: 'List the current user addresses' })
  @ApiOkResponse({ description: 'Addresses', type: ListAddressesResponseDto, isArray: true })
  @ApiCookieAuth('session')
  @Get()
  listAddresses(@Req() req: Request): Promise<ListAddressesResponseDto[]> {
    return this.address.listAddresses(this.currentUserId(req));
  }

  @ApiOperation({ summary: 'Get one of the current user addresses' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Address', type: GetAddressResponseDto })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiCookieAuth('session')
  @Get(':id')
  getAddress(@Req() req: Request, @Param('id', ParseIntPipe) id: number): Promise<GetAddressResponseDto> {
    return this.address.getAddress(this.currentUserId(req), id);
  }

  @ApiOperation({ summary: 'Create an address for the current user' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: CreateAddressRequestDto })
  @ApiCreatedResponse({ description: 'Created address', type: CreateAddressResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiNotFoundResponse({ description: 'Location not found' })
  @ApiCookieAuth('session')
  @Post()
  createAddress(@Req() req: Request, @Body() body: CreateAddressRequestDto): Promise<CreateAddressResponseDto> {
    return this.address.createAddress(this.currentUserId(req), body);
  }

  @ApiOperation({ summary: 'Update one of the current user addresses' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateAddressRequestDto })
  @ApiOkResponse({ description: 'Updated address', type: UpdateAddressResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiNotFoundResponse({ description: 'Address or location not found' })
  @ApiCookieAuth('session')
  @Patch(':id')
  updateAddress(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateAddressRequestDto): Promise<UpdateAddressResponseDto> {
    return this.address.updateAddress(this.currentUserId(req), id, body);
  }

  @ApiOperation({ summary: 'Set one of the current user addresses as the default' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Default address', type: SetMainAddressResponseDto })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiCookieAuth('session')
  @Patch(':id/main')
  setMainAddress(@Req() req: Request, @Param('id', ParseIntPipe) id: number): Promise<SetMainAddressResponseDto> {
    return this.address.setMainAddress(this.currentUserId(req), id);
  }

  @ApiOperation({ summary: 'Delete one of the current user addresses' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Address deleted', type: DeleteAddressResponseDto })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiCookieAuth('session')
  @Delete(':id')
  deleteAddress(@Req() req: Request, @Param('id', ParseIntPipe) id: number): Promise<DeleteAddressResponseDto> {
    return this.address.deleteAddress(this.currentUserId(req), id);
  }

  private currentUserId(req: Request): number {
    return (req.user as SessionUser).userId;
  }
}
