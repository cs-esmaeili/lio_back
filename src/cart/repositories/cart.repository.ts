import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { cartItems, carts, files, productImages, productVariants, products } from 'src/database/schema';

export type CartRow = typeof carts.$inferSelect;

export type CartItemRow = {
  variantId: number;
  quantity: number;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  stock: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImagePath: string | null;
};

export type CartVariantRow = {
  id: number;
  stock: number;
};

@Injectable()
export class CartRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  findByUserId(userId: number): Promise<CartRow | undefined> {
    return this.db.query.carts.findFirst({ where: eq(carts.userId, userId) });
  }

  findByGuestToken(guestToken: string): Promise<CartRow | undefined> {
    return this.db.query.carts.findFirst({ where: eq(carts.guestToken, guestToken) });
  }

  findVariantById(variantId: number): Promise<CartVariantRow | undefined> {
    return this.db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
      columns: { id: true, stock: true },
    });
  }

  findItem(cartId: number, variantId: number): Promise<{ quantity: number } | undefined> {
    return this.db.query.cartItems.findFirst({
      where: and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)),
      columns: { quantity: true },
    });
  }

  /**
   * The cart projection: each item joined to its variant and product so the
   * current price/stock and the product title are always resolved live.
   */
  listItems(cartId: number): Promise<CartItemRow[]> {
    return this.db
      .select({
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        sku: productVariants.sku,
        price: productVariants.price,
        compareAtPrice: productVariants.compareAtPrice,
        stock: productVariants.stock,
        productId: products.id,
        productName: products.name,
        productSlug: products.slug,
        // Primary product image (falls back to the first by sort order).
        productImagePath: sql<string | null>`(
          select ${files.path}
          from ${productImages}
          inner join ${files} on ${files.id} = ${productImages.fileId}
          where ${productImages.productId} = ${products.id}
          order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc, ${productImages.id} asc
          limit 1
        )`,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(cartItems.cartId, cartId))
      .orderBy(asc(cartItems.createdAt), asc(cartItems.id));
  }

  getOrCreateForUser(userId: number): Promise<CartRow> {
    return this.getOrCreate({ userId });
  }

  getOrCreateForGuest(guestToken: string): Promise<CartRow> {
    return this.getOrCreate({ guestToken });
  }

  async addItem(cartId: number, variantId: number, delta: number): Promise<void> {
    await this.db
      .insert(cartItems)
      .values({ cartId, variantId, quantity: delta })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.variantId],
        set: { quantity: sql`${cartItems.quantity} + ${delta}`, updatedAt: new Date() },
      });
  }

  async setItemQuantity(cartId: number, variantId: number, quantity: number): Promise<number> {
    const rows = await this.db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)))
      .returning({ id: cartItems.id });
    return rows.length;
  }

  async removeItem(cartId: number, variantId: number): Promise<number> {
    const rows = await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)))
      .returning({ id: cartItems.id });
    return rows.length;
  }

  /**
   * Resolve the identity to a single cart.
   *
   * When the request carries both a user and a guest token, the guest cart is
   * merged into the user cart first: this is the lazy login-merge. The guest
   * cart is then deleted, so the operation is idempotent for repeated requests.
   */
  async resolveCart(params: { userId: number | null; guestToken: string | null }, options: { create: boolean }): Promise<CartRow | null> {
    const { userId, guestToken } = params;

    if (userId !== null && guestToken !== null) {
      return this.mergeGuestIntoUser(userId, guestToken, options);
    }
    if (userId !== null) {
      const existing = await this.findByUserId(userId);
      return existing ?? (options.create ? this.getOrCreateForUser(userId) : null);
    }
    if (guestToken !== null) {
      const existing = await this.findByGuestToken(guestToken);
      return existing ?? (options.create ? this.getOrCreateForGuest(guestToken) : null);
    }
    return null;
  }

  private async getOrCreate(owner: { userId: number } | { guestToken: string }): Promise<CartRow> {
    const inserted = await this.insertCart(owner);
    if (inserted) return inserted;

    // Lost a race: another request created the cart between our insert and now.
    const existing = 'userId' in owner ? await this.findByUserId(owner.userId) : await this.findByGuestToken(owner.guestToken);
    if (!existing) throw new Error('Cart could not be created');
    return existing;
  }

  private async mergeGuestIntoUser(userId: number, guestToken: string, options: { create: boolean }): Promise<CartRow | null> {
    return this.db.transaction(async (tx) => {
      const guestCart = await tx.query.carts.findFirst({ where: eq(carts.guestToken, guestToken) });
      let userCart = await tx.query.carts.findFirst({ where: eq(carts.userId, userId) });

      if (!guestCart) {
        if (userCart) return userCart;
        if (!options.create) return null;
        userCart = (await tx.insert(carts).values({ userId }).onConflictDoNothing().returning())[0] ?? (await tx.query.carts.findFirst({ where: eq(carts.userId, userId) }));
        if (!userCart) throw new Error('Cart could not be created');
        return userCart;
      }

      userCart ??= (await tx.insert(carts).values({ userId }).onConflictDoNothing().returning())[0] ?? (await tx.query.carts.findFirst({ where: eq(carts.userId, userId) }));
      if (!userCart) throw new Error('Cart could not be created');

      // Move every guest item, summing quantities for variants already in the user cart.
      await tx.execute(sql`
        insert into "cart_items" ("cart_id", "variant_id", "quantity", "updated_at")
        select ${userCart.id}::integer, "variant_id", "quantity", now() from "cart_items" where "cart_id" = ${guestCart.id}
        on conflict ("cart_id", "variant_id") do update
          set "quantity" = "cart_items"."quantity" + excluded."quantity",
              "updated_at" = now()
      `);
      await tx.delete(carts).where(eq(carts.id, guestCart.id));

      return userCart;
    });
  }

  private async insertCart(owner: { userId: number } | { guestToken: string }): Promise<CartRow | undefined> {
    const rows = await this.db.insert(carts).values(owner).onConflictDoNothing().returning();
    return rows[0];
  }
}
