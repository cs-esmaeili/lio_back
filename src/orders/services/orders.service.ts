import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { orderItems, orders, OrderStatus, payments, productImages } from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { ListMyOrdersRequestDto } from '../dtos/listMyOrders/list-my-orders-request.dto';
import type { ListMyOrdersResponseDto } from '../dtos/listMyOrders/list-my-orders-response.dto';
import type { GetMyOrderResponseDto } from '../dtos/getMyOrder/get-my-order-response.dto';
import type { ListOrdersRequestDto } from '../dtos/listOrders/list-orders-request.dto';
import type { ListOrdersResponseDto } from '../dtos/listOrders/list-orders-response.dto';
import type { GetOrderResponseDto } from '../dtos/getOrder/get-order-response.dto';
import type { ShipOrderResponseDto } from '../dtos/shipOrder/ship-order-response.dto';
import type { CompleteOrderResponseDto } from '../dtos/completeOrder/complete-order-response.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type OrderDetailRow = NonNullable<Awaited<ReturnType<OrdersService['loadOrderDetail']>>>;

/**
 * Read-only order history. The profile routes are always scoped to the session
 * user id, so a customer can only ever read their own orders; the admin routes
 * read every order and additionally expose the owner.
 */
@Injectable()
export class OrdersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly fileUrl: FileUrlService,
  ) {}

  /* ------------------------------------------------------------------------ */
  /*  Customer — /profile/orders                                              */
  /* ------------------------------------------------------------------------ */

  async listMyOrders(userId: number, query: ListMyOrdersRequestDto): Promise<ListMyOrdersResponseDto> {
    const { page, limit, skip } = this.resolve(query);

    const filters: SQL[] = [eq(orders.userId, userId)];
    if (query.status !== undefined) {
      filters.push(eq(orders.status, query.status));
    }
    if (query.search?.trim()) {
      filters.push(ilike(orders.orderNumber, `%${query.search.trim()}%`));
    }
    const where = and(...filters);

    const [total, rows] = await Promise.all([
      this.db.$count(orders, where),
      this.db.query.orders.findMany({
        where,
        orderBy: [desc(orders.id)],
        limit,
        offset: skip,
        columns: { id: true, orderNumber: true, status: true, total: true, createdAt: true, paidAt: true },
        with: { items: { columns: { id: true } } },
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        orderNumber: row.orderNumber,
        status: row.status,
        total: Number(row.total),
        itemCount: row.items.length,
        createdAt: row.createdAt.toISOString(),
        paidAt: row.paidAt?.toISOString() ?? null,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getMyOrder(userId: number, orderNumber: string): Promise<GetMyOrderResponseDto> {
    const row = await this.loadOrderDetail(and(eq(orders.userId, userId), eq(orders.orderNumber, orderNumber)));
    if (!row) {
      throw new NotFoundException('Order not found');
    }

    return this.toOrderDetail(row);
  }

  /* ------------------------------------------------------------------------ */
  /*  Admin — /admin/orders (requires `order:read`)                           */
  /* ------------------------------------------------------------------------ */

  async listOrders(query: ListOrdersRequestDto): Promise<ListOrdersResponseDto> {
    const { page, limit, skip } = this.resolve(query);

    const filters: SQL[] = [];
    if (query.status !== undefined) {
      filters.push(eq(orders.status, query.status));
    }
    if (query.userId !== undefined) {
      filters.push(eq(orders.userId, query.userId));
    }
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      const search = or(ilike(orders.orderNumber, term), ilike(orders.firstName, term), ilike(orders.lastName, term), ilike(orders.phone, term));
      if (search) filters.push(search);
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [total, rows] = await Promise.all([
      this.db.$count(orders, where),
      this.db.query.orders.findMany({
        where,
        orderBy: [desc(orders.id)],
        limit,
        offset: skip,
        columns: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          firstName: true,
          lastName: true,
          phone: true,
          userId: true,
          createdAt: true,
          paidAt: true,
        },
        with: {
          items: { columns: { id: true } },
          user: { columns: { id: true, username: true } },
        },
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        orderNumber: row.orderNumber,
        status: row.status,
        total: Number(row.total),
        itemCount: row.items.length,
        customerName: [row.firstName, row.lastName].filter(Boolean).join(' '),
        phone: row.phone,
        userId: row.userId,
        username: row.user?.username ?? null,
        createdAt: row.createdAt.toISOString(),
        paidAt: row.paidAt?.toISOString() ?? null,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getOrder(id: number): Promise<GetOrderResponseDto> {
    const row = await this.loadOrderDetail(eq(orders.id, id));
    if (!row) {
      throw new NotFoundException('Order not found');
    }

    return { ...this.toOrderDetail(row), userId: row.userId, username: row.user?.username ?? null };
  }

  /**
   * Mark a paid order as shipped and record the carrier tracking code. Guarded
   * by `PAID -> SHIPPED`, so a completed/expired/canceled order cannot be shipped.
   */
  async shipOrder(id: number, trackingCode: string): Promise<ShipOrderResponseDto> {
    const updated = await this.db
      .update(orders)
      .set({ status: OrderStatus.SHIPPED, trackingCode, shippedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.status, OrderStatus.PAID)))
      .returning({ id: orders.id });

    if (updated.length === 0) {
      await this.assertExists(id);
      throw new BadRequestException('Only a paid order can be shipped');
    }

    return { ok: true };
  }

  /** Mark a shipped order as completed. Guarded by `SHIPPED -> COMPLETED`. */
  async completeOrder(id: number): Promise<CompleteOrderResponseDto> {
    const updated = await this.db
      .update(orders)
      .set({ status: OrderStatus.COMPLETED, completedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.status, OrderStatus.SHIPPED)))
      .returning({ id: orders.id });

    if (updated.length === 0) {
      await this.assertExists(id);
      throw new BadRequestException('Only a shipped order can be completed');
    }

    return { ok: true };
  }

  private async assertExists(id: number): Promise<void> {
    const existing = await this.db.query.orders.findFirst({ where: eq(orders.id, id), columns: { id: true } });
    if (!existing) {
      throw new NotFoundException('Order not found');
    }
  }

  /* ------------------------------------------------------------------------ */
  /*  Shared                                                                  */
  /* ------------------------------------------------------------------------ */

  private loadOrderDetail(where: SQL | undefined) {
    return this.db.query.orders.findFirst({
      where,
      with: {
        items: {
          columns: {
            id: true,
            productId: true,
            productName: true,
            productSlug: true,
            sku: true,
            unitPrice: true,
            quantity: true,
            lineTotal: true,
          },
          orderBy: [asc(orderItems.id)],
          with: {
            product: {
              columns: { id: true },
              with: {
                images: {
                  columns: { isPrimary: true, isThumbnail: true },
                  with: { file: { columns: { path: true } } },
                  orderBy: [asc(productImages.sortOrder), asc(productImages.id)],
                },
              },
            },
          },
        },
        payments: {
          columns: { provider: true, status: true, refId: true },
          orderBy: [desc(payments.id)],
        },
        user: { columns: { id: true, username: true } },
      },
    });
  }

  private toOrderDetail(row: OrderDetailRow): GetMyOrderResponseDto {
    const payment = row.payments[0] ?? null;

    return {
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      shippingCost: Number(row.shippingCost),
      total: Number(row.total),
      customer: {
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        company: row.company,
      },
      shippingAddress: {
        province: row.province,
        city: row.city,
        address: row.address,
        postalCode: row.postalCode,
      },
      payment: payment ? { provider: payment.provider, status: payment.status, refId: payment.refId } : null,
      items: row.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        sku: item.sku,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
        imageUrl: this.toItemImageUrl(item.product?.images ?? []),
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      paidAt: row.paidAt?.toISOString() ?? null,
      canceledAt: row.canceledAt?.toISOString() ?? null,
      trackingCode: row.trackingCode,
      shippedAt: row.shippedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      expiresAt: row.expiresAt.toISOString(),
    };
  }

  private toItemImageUrl(images: Array<{ isPrimary: boolean; isThumbnail: boolean; file: { path: string } }>): string | null {
    const image = images.find((item) => item.isPrimary) ?? images.find((item) => item.isThumbnail) ?? images[0] ?? null;
    return this.fileUrl.toUrl(image?.file?.path ?? null);
  }

  private resolve(query: { page?: number; limit?: number }): { page: number; limit: number; skip: number } {
    const page = query.page && query.page > 0 ? query.page : 1;
    const requested = query.limit && query.limit > 0 ? query.limit : DEFAULT_LIMIT;
    const limit = Math.min(requested, MAX_LIMIT);
    return { page, limit, skip: (page - 1) * limit };
  }
}
