import { Inject, Injectable } from '@nestjs/common';
import { and, eq, exists, gt, sql, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { FilterType, productVariants, products } from 'src/database/schema';
import { displayVariantCompareAtPrice, displayVariantPrice } from '../product-price';
import type { GetProductGlobalFiltersResponseDto } from '../dtos/getProductGlobalFilters/get-product-global-filters-response.dto';

export interface ProductGlobalFilters {
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  hasDiscount?: boolean;
}

/**
 * Global (non-attribute) product filters: price, availability and discount.
 *
 * Price and discount resolve to the variant a product card displays, so
 * filtering matches what the user sees.
 */
@Injectable()
export class ProductGlobalFilterService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Static definitions the frontend uses to render the global filter panel. */
  listDefinitions(): GetProductGlobalFiltersResponseDto {
    return {
      filters: [
        { key: 'price', title: 'قیمت', type: FilterType.RANGE },
        { key: 'inStock', title: 'فقط کالاهای موجود', type: FilterType.TOGGLE },
        { key: 'hasDiscount', title: 'فقط کالاهای تخفیفدار', type: FilterType.TOGGLE },
      ],
    };
  }

  /** `where` conditions for the global filters, AND-ed with the rest of the search. */
  buildWhere(filters: ProductGlobalFilters): SQL[] {
    const conditions: SQL[] = [];
    const price = displayVariantPrice();

    if (filters.minPrice !== undefined) {
      conditions.push(sql`${price} >= ${filters.minPrice}`);
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(sql`${price} <= ${filters.maxPrice}`);
    }

    if (filters.inStock) {
      // Any variant is purchasable, so "in stock" is not limited to the default one.
      conditions.push(
        exists(
          this.db
            .select({ value: sql`1` })
            .from(productVariants)
            .where(and(eq(productVariants.productId, products.id), gt(productVariants.stock, 0))),
        ),
      );
    }

    if (filters.hasDiscount) {
      const compareAtPrice = displayVariantCompareAtPrice();
      conditions.push(sql`${compareAtPrice} is not null and ${compareAtPrice} > ${price}`);
    }

    return conditions;
  }
}
