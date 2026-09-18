import { Injectable } from '@nestjs/common';

export interface OffsetPaginationQuery {
  page?: number;
  limit?: number;
}

export interface OffsetPaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Shared offset pagination. Registered in the global CommonModule so any
 * service can inject it and keep the page-size policy in one place.
 */
@Injectable()
export class PaginationService {
  /**
   * Normalize a `page`/`limit` query into Prisma `skip`/`take`.
   *
   * Defaults the page size and caps it so a client cannot request an unbounded
   * number of rows. Invalid (non-positive) values fall back to the defaults.
   */
  resolveOffset(query: OffsetPaginationQuery = {}): OffsetPaginationParams {
    const page = query.page && query.page > 0 ? query.page : 1;
    const requestedLimit = query.limit && query.limit > 0 ? query.limit : DEFAULT_LIMIT;
    const limit = Math.min(requestedLimit, MAX_LIMIT);

    return { page, limit, skip: (page - 1) * limit, take: limit };
  }

  /** Build the pagination metadata returned alongside a list of items. */
  buildMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
