import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CartRow } from '../repositories/cart.repository';
import { CartRepository } from '../repositories/cart.repository';
import type { GetCartResponseDto } from '../dtos/getCart/get-cart-response.dto';
import type { AddCartItemRequestDto } from '../dtos/addCartItem/add-cart-item-request.dto';
import type { AddCartItemResponseDto } from '../dtos/addCartItem/add-cart-item-response.dto';
import type { UpdateCartItemRequestDto } from '../dtos/updateCartItem/update-cart-item-request.dto';
import type { UpdateCartItemResponseDto } from '../dtos/updateCartItem/update-cart-item-response.dto';
import type { RemoveCartItemResponseDto } from '../dtos/removeCartItem/remove-cart-item-response.dto';

export interface CartIdentity {
  userId: number | null;
  guestToken: string | null;
}

@Injectable()
export class CartService {
  constructor(private readonly repository: CartRepository) {}

  async getCart(identity: CartIdentity): Promise<GetCartResponseDto> {
    const cart = await this.repository.resolveCart(identity, { create: false });
    return cart ? this.buildCart(cart) : { items: [], itemCount: 0, distinctItemCount: 0, subtotal: 0 };
  }

  async addCartItem(identity: CartIdentity, dto: AddCartItemRequestDto): Promise<AddCartItemResponseDto> {
    const variant = await this.repository.findVariantById(dto.variantId);
    if (!variant) throw new NotFoundException('Variant not found');

    const cart = await this.requireCart(identity);
    const quantity = dto.quantity ?? 1;
    const existing = await this.repository.findItem(cart.id, dto.variantId);
    this.assertInStock(variant.stock, (existing?.quantity ?? 0) + quantity);

    await this.repository.addItem(cart.id, dto.variantId, quantity);
    return this.buildCart(cart);
  }

  async updateCartItem(identity: CartIdentity, variantId: number, dto: UpdateCartItemRequestDto): Promise<UpdateCartItemResponseDto> {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) throw new NotFoundException('Variant not found');

    const cart = await this.requireExistingCart(identity);
    const existing = await this.repository.findItem(cart.id, variantId);
    if (!existing) throw new NotFoundException('Variant is not in the cart');
    this.assertInStock(variant.stock, dto.quantity);

    await this.repository.setItemQuantity(cart.id, variantId, dto.quantity);
    return this.buildCart(cart);
  }

  async removeCartItem(identity: CartIdentity, variantId: number): Promise<RemoveCartItemResponseDto> {
    const cart = await this.requireExistingCart(identity);
    const removed = await this.repository.removeItem(cart.id, variantId);
    if (removed === 0) throw new NotFoundException('Variant is not in the cart');
    return this.buildCart(cart);
  }

  private async requireCart(identity: CartIdentity): Promise<CartRow> {
    const cart = await this.repository.resolveCart(identity, { create: true });
    if (!cart) throw new BadRequestException('A cart token is required for guests');
    return cart;
  }

  private async requireExistingCart(identity: CartIdentity): Promise<CartRow> {
    const cart = await this.repository.resolveCart(identity, { create: false });
    if (!cart) throw new NotFoundException('Cart is empty');
    return cart;
  }

  private assertInStock(stock: number, quantity: number): void {
    if (stock <= 0) throw new BadRequestException('Variant is out of stock');
    if (quantity > stock) throw new BadRequestException(`Only ${stock} item(s) available`);
  }

  private async buildCart(cart: CartRow): Promise<GetCartResponseDto> {
    const rows = await this.repository.listItems(cart.id);

    const items = rows.map((row) => {
      const price = Number(row.price);
      return {
        variantId: row.variantId,
        quantity: row.quantity,
        lineTotal: price * row.quantity,
        product: { id: row.productId, name: row.productName, slug: row.productSlug },
        variant: {
          id: row.variantId,
          sku: row.sku,
          price,
          compareAtPrice: row.compareAtPrice === null ? null : Number(row.compareAtPrice),
          stock: row.stock,
        },
      };
    });

    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      distinctItemCount: items.length,
      subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    };
  }
}
