import { Injectable } from '@nestjs/common';
import { asc, desc, type SQL } from 'drizzle-orm';
import { products } from 'src/database/schema';
import { ProductSort } from '../product-sort';
import { displayVariantPrice } from '../product-price';
import type { GetProductSortOptionsResponseDto } from '../dtos/getProductSortOptions/get-product-sort-options-response.dto';

/**
 * Product sort options. Ordering by price uses the variant a product card
 * displays, and every ordering is tie-broken by id for stable pagination.
 */
@Injectable()
export class ProductSortService {
  /** Static definitions the frontend uses to render the sort dropdown. */
  listOptions(): GetProductSortOptionsResponseDto {
    return {
      sorts: [
        { key: ProductSort.NEWEST, title: 'جدیدترین' },
        { key: ProductSort.CHEAPEST, title: 'ارزان‌ترین' },
        { key: ProductSort.MOST_EXPENSIVE, title: 'گران‌ترین' },
      ],
    };
  }

  buildOrderBy(sort?: ProductSort): SQL[] {
    const price = displayVariantPrice();

    switch (sort) {
      case ProductSort.CHEAPEST:
        return [asc(price), desc(products.id)];
      case ProductSort.MOST_EXPENSIVE:
        return [desc(price), desc(products.id)];
      case ProductSort.NEWEST:
      default:
        return [desc(products.createdAt), desc(products.id)];
    }
  }
}
