import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import type { SessionUser } from 'src/auth/session-user';
import { CheckoutService } from './services/checkout.service';
import { GetCheckoutResponseDto } from './dtos/getCheckout/get-checkout-response.dto';

/**
 * Checkout is always scoped to the authenticated user: the owner comes from the
 * session, never from a header. A guest cart is merged by the cart endpoints
 * before checkout (see docs/cart-api.md), so no cart token is accepted here.
 */
@UseGuards(SessionAuthGuard, CsrfGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @ApiOperation({ summary: 'Get the checkout page payload for the authenticated user' })
  @ApiCookieAuth('session')
  @ApiOkResponse({ description: 'Cart lines, pricing breakdown, shipping, customer, addresses and payment gateway', type: GetCheckoutResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @Get()
  getCheckout(@Req() req: Request): Promise<GetCheckoutResponseDto> {
    return this.checkout.getCheckout((req.user as SessionUser).userId);
  }
}
