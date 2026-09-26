import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import type { SessionUser } from 'src/auth/session-user';
import { CreatePaymentRequestDto } from './dtos/createPayment/create-payment-request.dto';
import { CreatePaymentResponseDto } from './dtos/createPayment/create-payment-response.dto';
import { CheckoutPaymentService } from './services/checkout-payment.service';

/**
 * Payment flow: `POST /payments` turns the authenticated user's cart into an
 * order and opens a gateway session; `GET /payments/callback` is the public URL
 * the gateway redirects the payer back to. The callback never returns JSON: it
 * verifies the payment and redirects the browser to the frontend result page.
 */
@UseGuards(SessionAuthGuard, CsrfGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly checkoutPayment: CheckoutPaymentService) {}

  @ApiOperation({ summary: 'Create an order from the cart and start a gateway payment' })
  @ApiHeader(CSRF_HEADER)
  @ApiBody({ type: CreatePaymentRequestDto })
  @ApiCreatedResponse({ description: 'Order created; redirect the payer to paymentUrl', type: CreatePaymentResponseDto })
  @ApiBadRequestResponse({ description: 'Empty cart, invalid address id, or insufficient stock' })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiBadGatewayResponse({ description: 'The payment gateway rejected the request; the order was canceled' })
  @ApiCookieAuth('session')
  @Post()
  createPayment(@Req() req: Request, @Body() body: CreatePaymentRequestDto): Promise<CreatePaymentResponseDto> {
    return this.checkoutPayment.createPayment((req.user as SessionUser).userId, body);
  }

  @ApiOperation({
    summary: 'Payment gateway callback (public)',
    description: 'Verifies the payment and redirects the payer to the frontend result page with the outcome in the query string.',
  })
  @ApiQuery({ name: 'Authority', required: false, type: String, description: 'Authority returned by the gateway' })
  @ApiQuery({ name: 'Status', required: false, type: String, example: 'OK', description: 'Gateway status; `OK` means the payer paid' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to the frontend result page. The outcome is in the Location query string.',
    headers: {
      Location: {
        description: 'Frontend result page URL with status, orderId, orderNumber, refId and (on failure) reason',
        schema: { type: 'string', example: 'https://front.local/payment/result?status=success&orderId=42&orderNumber=ORD-20260926-4F2A9C10BD&refId=123456789' },
      },
    },
  })
  @Public()
  @Get('callback')
  async paymentCallback(@Query('Authority') authority: string | undefined, @Query('Status') status: string | undefined, @Res() res: Response): Promise<void> {
    const url = await this.checkoutPayment.handleCallback(authority, status);
    res.redirect(url);
  }
}
