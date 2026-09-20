import { sql, type SQL } from 'drizzle-orm';

/**
 * SQL for the variant price a product card displays: the default variant,
 * resolved with the same ordering the product projection uses
 * (`is_default desc, position asc, id asc`).
 *
 * Written with explicit identifiers on purpose. Inside the relational query
 * builder, a column interpolated into a raw fragment is qualified with the root
 * table, which is wrong for a correlated subquery on another table.
 */
export function displayVariantPrice(): SQL<string> {
  return sql<string>`(
    select "product_variants"."price"
    from "product_variants"
    where "product_variants"."product_id" = "products"."id"
    order by "product_variants"."is_default" desc, "product_variants"."position" asc, "product_variants"."id" asc
    limit 1
  )`;
}

export function displayVariantCompareAtPrice(): SQL<string | null> {
  return sql<string | null>`(
    select "product_variants"."compare_at_price"
    from "product_variants"
    where "product_variants"."product_id" = "products"."id"
    order by "product_variants"."is_default" desc, "product_variants"."position" asc, "product_variants"."id" asc
    limit 1
  )`;
}
