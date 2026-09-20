import { asc, inArray, like } from 'drizzle-orm';
import { attributeValues, categories, productAttributeValues, productCategories, productImages, productVariants, products, variantAttributeValues } from '../schema';
import { ensureFakeImageFiles } from './fake-images';
import type { SeedDb } from './db';

const PRODUCT_COUNT = 500;
const IMAGES_PER_PRODUCT = 2;
const VARIANTS_PER_PRODUCT = 2;
const SLUG_PREFIX = 'seed-product-';
const SKU_PREFIX = 'SEED-SKU-';
const SLUG_LIKE = `${SLUG_PREFIX}%`;

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
    with: { attribute: { columns: { name: true } } },
  });
  if (!categoryAttributeRows.length) {
    throw new Error('No category attributes found. Run the "attributes" seed first.');
  }

  const attributesByCategory = new Map<number, Array<{ id: number; name: string }>>();
  for (const link of categoryAttributeRows) {
    const list = attributesByCategory.get(link.categoryId) ?? [];
    list.push({ id: link.attributeId, name: link.attribute.name });
    attributesByCategory.set(link.categoryId, list);
  }

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

  const productAttributeValueRows = productIds.flatMap((productId, index) => {
    const categoryId = productCategoryRows[index].categoryId;
    return (attributesByCategory.get(categoryId) ?? []).map((attribute, attributeIndex) => {
      const options = optionsByAttribute.get(attribute.id) ?? [];
      if (!options.length) {
        throw new Error(`Attribute "${attribute.name}" has no values. Run the "attributes" seed first.`);
      }
      return {
        productId,
        attributeId: attribute.id,
        attributeValueId: options[(index + attributeIndex) % options.length],
      };
    });
  });
  await db.insert(productAttributeValues).values(productAttributeValueRows);

  const storedValues = await db.query.productAttributeValues.findMany({
    where: inArray(productAttributeValues.productId, productIds),
    columns: { id: true, productId: true },
  });
  const valuesByProduct = new Map<number, number[]>();
  for (const value of storedValues) {
    const list = valuesByProduct.get(value.productId) ?? [];
    list.push(value.id);
    valuesByProduct.set(value.productId, list);
  }

  const variantRows = productIds.flatMap((productId, index) => {
    const basePrice = 100000 + (((index + 1) * 7919) % 900000);
    return Array.from({ length: VARIANTS_PER_PRODUCT }, (_, variantIndex) => ({
      productId,
      sku: `${SKU_PREFIX}${index + 1}-${variantIndex + 1}`,
      price: String(basePrice + variantIndex * 10000),
      compareAtPrice: String(basePrice + variantIndex * 10000 + 50000),
      stock: (index * 7 + variantIndex * 3) % 50,
      position: variantIndex,
      isDefault: variantIndex === 0,
    }));
  });
  await db.insert(productVariants).values(variantRows);

  const storedVariants = await db.query.productVariants.findMany({
    where: inArray(productVariants.productId, productIds),
    columns: { id: true, productId: true },
  });
  const variantAttributeValueRows = storedVariants.flatMap((variant) =>
    (valuesByProduct.get(variant.productId) ?? []).map((productAttributeValueId) => ({
      variantId: variant.id,
      productAttributeValueId,
    })),
  );
  if (variantAttributeValueRows.length) {
    await db.insert(variantAttributeValues).values(variantAttributeValueRows);
  }

  return productIds.length;
}
