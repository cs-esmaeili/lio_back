import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { LocationService } from './services/location.service';
import { ListLocationsResponseDto } from './dtos/listLocations/list-locations-response.dto';
import { GetLocationResponseDto } from './dtos/getLocation/get-location-response.dto';
import { CreateLocationRequestDto } from './dtos/createLocation/create-location-request.dto';
import { CreateLocationResponseDto } from './dtos/createLocation/create-location-response.dto';
import { UpdateLocationRequestDto } from './dtos/updateLocation/update-location-request.dto';
import { UpdateLocationResponseDto } from './dtos/updateLocation/update-location-response.dto';
import { DeleteLocationResponseDto } from './dtos/deleteLocation/delete-location-response.dto';

/**
 * Reading locations only requires an authenticated session; creating, updating
 * and deleting each require their own permission.
 */
@UseGuards(SessionAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('locations')
export class LocationController {
  constructor(private readonly location: LocationService) {}

  @ApiOperation({ summary: 'List all locations' })
  @ApiOkResponse({ description: 'Locations', type: ListLocationsResponseDto, isArray: true })
  @ApiCookieAuth('session')
  @Get()
  listLocations(): Promise<ListLocationsResponseDto[]> {
    return this.location.listLocations();
  }

  @ApiOperation({ summary: 'Get a location by id' })
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiOkResponse({ description: 'Location', type: GetLocationResponseDto })
  @ApiNotFoundResponse({ description: 'Location not found' })
  @ApiCookieAuth('session')
  @Get(':id')
  getLocation(@Param('id', ParseIntPipe) id: number): Promise<GetLocationResponseDto> {
    return this.location.getLocation(id);
  }

  @ApiOperation({ summary: 'Create a location' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: CreateLocationRequestDto })
  @ApiCreatedResponse({ description: 'Created location', type: CreateLocationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('location:create')
  @Post()
  createLocation(@Body() body: CreateLocationRequestDto): Promise<CreateLocationResponseDto> {
    return this.location.createLocation(body);
  }

  @ApiOperation({ summary: 'Update a location' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiBody({ type: UpdateLocationRequestDto })
  @ApiOkResponse({ description: 'Updated location', type: UpdateLocationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiNotFoundResponse({ description: 'Location not found' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('location:update')
  @Patch(':id')
  updateLocation(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateLocationRequestDto): Promise<UpdateLocationResponseDto> {
    return this.location.updateLocation(id, body);
  }

  @ApiOperation({ summary: 'Delete a location' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiOkResponse({ description: 'Location deleted', type: DeleteLocationResponseDto })
  @ApiNotFoundResponse({ description: 'Location not found' })
  @ApiConflictResponse({ description: 'Location is in use by an address' })
  @ApiCookieAuth('session')
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @Permissions('location:delete')
  @Delete(':id')
  deleteLocation(@Param('id', ParseIntPipe) id: number): Promise<DeleteLocationResponseDto> {
    return this.location.deleteLocation(id);
  }
}
