import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { Permissions } from 'src/authorization/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/authorization/guards/permissions.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import { OrdersService } from './services/orders.service';
import { ListOrdersRequestDto } from './dtos/listOrders/list-orders-request.dto';
import { ListOrdersResponseDto } from './dtos/listOrders/list-orders-response.dto';
import { GetOrderResponseDto } from './dtos/getOrder/get-order-response.dto';
import { ShipOrderRequestDto } from './dtos/shipOrder/ship-order-request.dto';
import { ShipOrderResponseDto } from './dtos/shipOrder/ship-order-response.dto';
import { CompleteOrderResponseDto } from './dtos/completeOrder/complete-order-response.dto';

/**
 * Admin order management (`/admin/orders`). Reads every order regardless of
 * owner and exposes the owning account. Requires the `order:read` permission;
 * the customer-facing history lives on `/profile/orders`.
 */
@UseGuards(SessionAuthGuard, PermissionsGuard, CsrfGuard)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @ApiOperation({ summary: 'List all orders (paginated, filterable by status, owner and order number/customer)' })
  @ApiOkResponse({ description: 'Paginated orders from every customer', type: ListOrdersResponseDto })
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiCookieAuth('session')
  @Permissions('order:read')
  @Get()
  listOrders(@Query() query: ListOrdersRequestDto): Promise<ListOrdersResponseDto> {
    return this.orders.listOrders(query);
  }

  @ApiOperation({ summary: 'Get a single order' })
  @ApiParam({ name: 'id', type: Number, example: 42, description: 'Order id' })
  @ApiOkResponse({ description: 'Order detail', type: GetOrderResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiCookieAuth('session')
  @Permissions('order:read')
  @Get(':id')
  getOrder(@Param('id', ParseIntPipe) id: number): Promise<GetOrderResponseDto> {
    return this.orders.getOrder(id);
  }

  @ApiOperation({ summary: 'Mark a paid order as shipped and record its postal tracking code' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 42, description: 'Order id' })
  @ApiBody({ type: ShipOrderRequestDto })
  @ApiOkResponse({ description: 'Order marked as shipped', type: ShipOrderResponseDto })
  @ApiBadRequestResponse({ description: 'The order is not in the PAID status' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiCookieAuth('session')
  @Permissions('order:manage')
  @Patch(':id/ship')
  shipOrder(@Param('id', ParseIntPipe) id: number, @Body() body: ShipOrderRequestDto): Promise<ShipOrderResponseDto> {
    return this.orders.shipOrder(id, body.trackingCode);
  }

  @ApiOperation({ summary: 'Mark a shipped order as completed' })
  @ApiHeader(CSRF_HEADER)
  @ApiParam({ name: 'id', type: Number, example: 42, description: 'Order id' })
  @ApiOkResponse({ description: 'Order marked as completed', type: CompleteOrderResponseDto })
  @ApiBadRequestResponse({ description: 'The order is not in the SHIPPED status' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'Missing permission' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiCookieAuth('session')
  @Permissions('order:manage')
  @Patch(':id/complete')
  completeOrder(@Param('id', ParseIntPipe) id: number): Promise<CompleteOrderResponseDto> {
    return this.orders.completeOrder(id);
  }
}
