import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCookieAuth, ApiHeader, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { isUUID } from 'class-validator';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { CSRF_HEADER } from 'src/common/swagger/csrf-header';
import { CART_TOKEN_API_HEADER, CART_TOKEN_HEADER } from './cart.constants';
import { CartService } from './services/cart.service';
import type { CartIdentity } from './services/cart.service';
import { GetCartResponseDto } from './dtos/getCart/get-cart-response.dto';
import { AddCartItemRequestDto } from './dtos/addCartItem/add-cart-item-request.dto';
import { AddCartItemResponseDto } from './dtos/addCartItem/add-cart-item-response.dto';
import { UpdateCartItemRequestDto } from './dtos/updateCartItem/update-cart-item-request.dto';
import { UpdateCartItemResponseDto } from './dtos/updateCartItem/update-cart-item-response.dto';
import { RemoveCartItemResponseDto } from './dtos/removeCartItem/remove-cart-item-response.dto';

interface JwtUser {
  userId: number;
}

/**
 * Cart endpoints work both authenticated and anonymously. A logged-in session
 * is read from the access-token cookie; a guest is identified by the
 * client-generated `X-Cart-Token` header. When both are present the guest cart
 * is merged into the user cart before the operation runs.
 */
@UseGuards(OptionalAuthGuard, CsrfGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @ApiOperation({ summary: 'Get the current cart (user cart or guest cart)' })
  @ApiHeader(CART_TOKEN_API_HEADER)
  @ApiCookieAuth('access_token')
  @ApiOkResponse({ description: 'The cart for the current user, or the empty cart for a new guest', type: GetCartResponseDto })
  @ApiBadRequestResponse({ description: 'Malformed X-Cart-Token header' })
  @Get()
  getCart(@Req() req: Request, @Headers(CART_TOKEN_HEADER) cartToken?: string): Promise<GetCartResponseDto> {
    return this.cart.getCart(this.toIdentity(req, cartToken));
  }

  @ApiOperation({ summary: 'Add a variant to the cart (merges the guest cart first when logged in)' })
  @ApiHeader(CART_TOKEN_API_HEADER)
  @ApiHeader(CSRF_HEADER)
  @ApiCookieAuth('access_token')
  @ApiOkResponse({ description: 'The cart after adding the variant', type: AddCartItemResponseDto })
  @ApiBadRequestResponse({ description: 'Out of stock, quantity above stock, or missing guest cart token' })
  @ApiNotFoundResponse({ description: 'Variant not found' })
  @Post('items')
  addCartItem(@Req() req: Request, @Headers(CART_TOKEN_HEADER) cartToken: string | undefined, @Body() body: AddCartItemRequestDto): Promise<AddCartItemResponseDto> {
    return this.cart.addCartItem(this.requireIdentity(req, cartToken), body);
  }

  @ApiOperation({ summary: 'Set the quantity of a variant in the cart' })
  @ApiHeader(CART_TOKEN_API_HEADER)
  @ApiHeader(CSRF_HEADER)
  @ApiCookieAuth('access_token')
  @ApiParam({ name: 'variantId', type: Number, example: 3744, description: 'Product variant id' })
  @ApiOkResponse({ description: 'The cart after updating the quantity', type: UpdateCartItemResponseDto })
  @ApiBadRequestResponse({ description: 'Quantity above stock or missing guest cart token' })
  @ApiNotFoundResponse({ description: 'Variant not found or not present in the cart' })
  @Patch('items/:variantId')
  updateCartItem(
    @Req() req: Request,
    @Headers(CART_TOKEN_HEADER) cartToken: string | undefined,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() body: UpdateCartItemRequestDto,
  ): Promise<UpdateCartItemResponseDto> {
    return this.cart.updateCartItem(this.requireIdentity(req, cartToken), variantId, body);
  }

  @ApiOperation({ summary: 'Remove a variant from the cart' })
  @ApiHeader(CART_TOKEN_API_HEADER)
  @ApiHeader(CSRF_HEADER)
  @ApiCookieAuth('access_token')
  @ApiParam({ name: 'variantId', type: Number, example: 3744, description: 'Product variant id' })
  @ApiOkResponse({ description: 'The cart after removing the variant', type: RemoveCartItemResponseDto })
  @ApiBadRequestResponse({ description: 'Missing guest cart token' })
  @ApiNotFoundResponse({ description: 'Variant not present in the cart' })
  @Delete('items/:variantId')
  removeCartItem(
    @Req() req: Request,
    @Headers(CART_TOKEN_HEADER) cartToken: string | undefined,
    @Param('variantId', ParseIntPipe) variantId: number,
  ): Promise<RemoveCartItemResponseDto> {
    return this.cart.removeCartItem(this.requireIdentity(req, cartToken), variantId);
  }

  private toIdentity(req: Request, cartToken?: string): CartIdentity {
    const user = req.user as JwtUser | undefined;
    const token = cartToken?.trim();
    if (token && !isUUID(token)) {
      throw new BadRequestException('Invalid X-Cart-Token header');
    }
    return { userId: user?.userId ?? null, guestToken: token ? token : null };
  }

  private requireIdentity(req: Request, cartToken?: string): CartIdentity {
    const identity = this.toIdentity(req, cartToken);
    if (identity.userId === null && identity.guestToken === null) {
      throw new BadRequestException('X-Cart-Token header is required for guests');
    }
    return identity;
  }
}
