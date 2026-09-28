import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import type { SessionUser } from 'src/auth/session-user';
import { OrdersService } from './services/orders.service';
import { ListMyOrdersRequestDto } from './dtos/listMyOrders/list-my-orders-request.dto';
import { ListMyOrdersResponseDto } from './dtos/listMyOrders/list-my-orders-response.dto';
import { GetMyOrderSummaryResponseDto } from './dtos/getMyOrderSummary/get-my-order-summary-response.dto';
import { GetMyOrderResponseDto } from './dtos/getMyOrder/get-my-order-response.dto';

/**
 * Customer order history (`/profile/orders`). Every query is scoped to the
 * authenticated user id taken from the session, so one customer can never read
 * another customer's orders. Admins read every order through `/admin/orders`.
 */
@UseGuards(SessionAuthGuard, CsrfGuard)
@Controller('profile/orders')
export class ProfileOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @ApiOperation({ summary: "List the authenticated user's orders (paginated, filterable by status and order number)" })
  @ApiOkResponse({ description: 'Paginated orders placed by the current user', type: ListMyOrdersResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiCookieAuth('session')
  @Get()
  listMyOrders(@Req() req: Request, @Query() query: ListMyOrdersRequestDto): Promise<ListMyOrdersResponseDto> {
    return this.orders.listMyOrders((req.user as SessionUser).userId, query);
  }

  @ApiOperation({ summary: "Counts of the authenticated user's orders grouped by status" })
  @ApiOkResponse({ description: 'Order count per status for the current user', type: GetMyOrderSummaryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiCookieAuth('session')
  @Get('summary')
  getMyOrderSummary(@Req() req: Request): Promise<GetMyOrderSummaryResponseDto> {
    return this.orders.getMyOrderSummary((req.user as SessionUser).userId);
  }

  @ApiOperation({ summary: "Get one of the authenticated user's orders" })
  @ApiParam({ name: 'orderNumber', type: String, example: 'ORD-20260926-4F2A9C10BD', description: 'Human-readable order number' })
  @ApiOkResponse({ description: 'Order detail', type: GetMyOrderResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found for the current user' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiCookieAuth('session')
  @Get(':orderNumber')
  getMyOrder(@Req() req: Request, @Param('orderNumber') orderNumber: string): Promise<GetMyOrderResponseDto> {
    return this.orders.getMyOrder((req.user as SessionUser).userId, orderNumber);
  }
}
