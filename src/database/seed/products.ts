import { asc, inArray, like } from 'drizzle-orm';
import {
  AttributeUsage,
  attributeValues,
  categories,
  productAttributeValues,
  productCategories,
  productImages,
  productVariants,
  products,
  variantAttributeValues,
} from '../schema';
import { ensureFakeImageFiles } from './fake-images';
import type { SeedDb } from './db';

const PRODUCT_COUNT = 500;
const IMAGES_PER_PRODUCT = 2;
/** How many values of each variant attribute a product offers. */
const VARIANT_VALUES_PER_ATTRIBUTE = 2;
const SLUG_PREFIX = 'seed-product-';
const SKU_PREFIX = 'SEED-SKU-';
const SLUG_LIKE = `${SLUG_PREFIX}%`;

/** Cartesian product of the value-id groups; one combination per variant. */
function combinationsOf(groups: number[][]): number[][] {
  return groups.reduce<number[][]>((combinations, group) => combinations.flatMap((combination) => group.map((value) => [...combination, value])), [[]]);
}

export async function seedProducts(db: SeedDb): Promise<number> {
  const seedFiles = await ensureFakeImageFiles(db);

  const allCategories = await db.query.categories.findMany({ columns: { id: true, parentId: true }, orderBy: asc(categories.id) });
  const parentIds = new Set(allCategories.filter((category) => category.parentId !== null).map((category) => category.parentId));
  const leafCategories = allCategories.filter((category) => !parentIds.has(category.id));
  if (!leafCategories.length) {
    throw new Error('No leaf categories found. Run the "categories" seed first.');
  }

  const categoryAttributeRows = await db.query.categoryAttributes.findMany({
    columns: { attributeId: true, categoryId: true },
    with: { attribute: { columns: { name: true, usage: true } } },
  });
  if (!categoryAttributeRows.length) {
    throw new Error('No category attributes found. Run the "attributes" seed first.');
  }

  const attributesByCategory = new Map<number, Array<{ id: number; name: string; usage: AttributeUsage }>>();
  for (const link of categoryAttributeRows) {
    const list = attributesByCategory.get(link.categoryId) ?? [];
    list.push({ id: link.attributeId, name: link.attribute.name, usage: link.attribute.usage });
    attributesByCategory.set(link.categoryId, list);
  }

  const attributeUsageById = new Map<number, AttributeUsage>(categoryAttributeRows.map((link) => [link.attributeId, link.attribute.usage]));

  const attributeValueRows = await db.query.attributeValues.findMany({
    columns: { id: true, attributeId: true },
    orderBy: [asc(attributeValues.sortOrder), asc(attributeValues.id)],
  });
  if (!attributeValueRows.length) {
    throw new Error('No attribute values found. Run the "attributes" seed first.');
  }

  const optionsByAttribute = new Map<number, number[]>();
  for (const option of attributeValueRows) {
    const list = optionsByAttribute.get(option.attributeId) ?? [];
    list.push(option.id);
    optionsByAttribute.set(option.attributeId, list);
  }

  await db.delete(products).where(like(products.slug, SLUG_LIKE));

  await db.insert(products).values(
    Array.from({ length: PRODUCT_COUNT }, (_, index) => {
      const number = index + 1;
      return {
        name: `محصول ${number}`,
        slug: `${SLUG_PREFIX}${number}`,
        description: `توضیحات نمونه برای محصول شماره ${number}.`,
      };
    }),
  );

  const created = await db.query.products.findMany({ where: like(products.slug, SLUG_LIKE), columns: { id: true, slug: true } });
  const idBySlug = new Map(created.map((product) => [product.slug, product.id]));
  const productIds = Array.from({ length: PRODUCT_COUNT }, (_, index) => idBySlug.get(`${SLUG_PREFIX}${index + 1}`)!);

  const productCategoryRows = productIds.map((productId, index) => ({
    productId,
    categoryId: leafCategories[index % leafCategories.length].id,
  }));
  await db.insert(productCategories).values(productCategoryRows);

  const productImageRows: Array<{
    productId: number;
    fileId: number;
    isPrimary: boolean;
    isThumbnail: boolean;
    sortOrder: number;
  }> = [];
  for (const [index, productId] of productIds.entries()) {
    for (let imageIndex = 0; imageIndex < IMAGES_PER_PRODUCT; imageIndex++) {
      const file = seedFiles[(index + imageIndex) % seedFiles.length];
      productImageRows.push({
        productId,
        fileId: file.id,
        isPrimary: imageIndex === 0,
        isThumbnail: imageIndex === 1,
        sortOrder: imageIndex,
      });
    }
  }
  await db.insert(productImages).values(productImageRows);

  // Spec attributes get one value per product; variant attributes get several
  // values so every product offers distinct variant combinations.
  const productAttributeValueRows = productIds.flatMap((productId, index) => {
    const categoryId = productCategoryRows[index].categoryId;
    return (attributesByCategory.get(categoryId) ?? []).flatMap((attribute, attributeIndex) => {
      const options = optionsByAttribute.get(attribute.id) ?? [];
      if (!options.length) {
        throw new Error(`Attribute "${attribute.name}" has no values. Run the "attributes" seed first.`);
      }

      const valueCount = attribute.usage === AttributeUsage.VARIANT ? Math.min(VARIANT_VALUES_PER_ATTRIBUTE, options.length) : 1;

      return Array.from({ length: valueCount }, (_, valueIndex) => ({
        productId,
        attributeId: attribute.id,
        attributeValueId: options[(index + attributeIndex + valueIndex) % options.length],
      }));
    });
  });
  await db.insert(productAttributeValues).values(productAttributeValueRows);

  const storedValues = await db.query.productAttributeValues.findMany({
    where: inArray(productAttributeValues.productId, productIds),
    columns: { id: true, productId: true, attributeId: true },
  });

  // Split each product's attribute values into the spec values shared by every
  // variant and the per-variant-attribute value groups used to build combinations.
  const specValueIdsByProduct = new Map<number, number[]>();
  const valueIdsByProductAttribute = new Map<string, number[]>();
  for (const productId of productIds) {
    specValueIdsByProduct.set(productId, []);
  }
  for (const value of storedValues) {
    if (attributeUsageById.get(value.attributeId) === AttributeUsage.VARIANT) {
      const key = `${value.productId}:${value.attributeId}`;
      const list = valueIdsByProductAttribute.get(key) ?? [];
      list.push(value.id);
      valueIdsByProductAttribute.set(key, list);
    } else {
      specValueIdsByProduct.get(value.productId)!.push(value.id);
    }
  }

  const variantValueGroupsByProduct = new Map<number, Array<{ attributeId: number; valueIds: number[] }>>();
  for (const productId of productIds) {
    variantValueGroupsByProduct.set(productId, []);
  }
  for (const [key, valueIds] of valueIdsByProductAttribute) {
    const [productId, attributeId] = key.split(':').map(Number);
    variantValueGroupsByProduct.get(productId)!.push({ attributeId, valueIds });
  }

  const variantRows: Array<{
    productId: number;
    sku: string;
    price: string;
    compareAtPrice: string;
    stock: number;
    position: number;
    isDefault: boolean;
  }> = [];
  const variantValueIds: Array<{ productId: number; position: number; productAttributeValueIds: number[] }> = [];

  for (const [index, productId] of productIds.entries()) {
    const groups = (variantValueGroupsByProduct.get(productId) ?? []).sort((a, b) => a.attributeId - b.attributeId);
    const combinations = combinationsOf(groups.map((group) => group.valueIds));
    const basePrice = 100000 + (((index + 1) * 7919) % 900000);

    combinations.forEach((combination, variantIndex) => {
      const price = basePrice + variantIndex * 10000;
      variantRows.push({
        productId,
        sku: `${SKU_PREFIX}${index + 1}-${variantIndex + 1}`,
        price: String(price),
        compareAtPrice: String(price + 50000),
        stock: (index * 7 + variantIndex * 3) % 50,
        position: variantIndex,
        isDefault: variantIndex === 0,
      });
      variantValueIds.push({ productId, position: variantIndex, productAttributeValueIds: combination });
    });
  }

  await db.insert(productVariants).values(variantRows);

  const storedVariants = await db.query.productVariants.findMany({
    where: inArray(productVariants.productId, productIds),
    columns: { id: true, productId: true, position: true },
  });
  const variantIdByProductPosition = new Map(storedVariants.map((variant) => [`${variant.productId}:${variant.position}`, variant.id]));

  const variantAttributeValueRows = variantValueIds.flatMap(({ productId, position, productAttributeValueIds }) => {
    const variantId = variantIdByProductPosition.get(`${productId}:${position}`)!;
    return [...specValueIdsByProduct.get(productId)!, ...productAttributeValueIds].map((productAttributeValueId) => ({
      variantId,
      productAttributeValueId,
    }));
  });
  if (variantAttributeValueRows.length) {
    await db.insert(variantAttributeValues).values(variantAttributeValueRows);
  }

  return productIds.length;
}
