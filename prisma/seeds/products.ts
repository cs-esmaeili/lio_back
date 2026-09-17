import type { PrismaClient } from '../../src/generated/prisma/client';
import { ensureFakeImageFiles } from './fake-images';

const PRODUCT_COUNT = 500;
const IMAGES_PER_PRODUCT = 2;
const VARIANTS_PER_PRODUCT = 2;
const SLUG_PREFIX = 'seed-product-';
const SKU_PREFIX = 'SEED-SKU-';

const ATTRIBUTE_VALUES: Record<string, string[]> = {
  رنگ: ['قرمز', 'آبی', 'سبز', 'مشکی', 'سفید'],
  سایز: ['S', 'M', 'L', 'XL'],
  جنس: ['نخ', 'پنبه', 'چرم', 'پلی‌استر'],
  برند: ['برند آ', 'برند ب', 'برند ج'],
};

function pickValue(name: string, productIndex: number, attributeIndex: number): string {
  const pool = ATTRIBUTE_VALUES[name] ?? [`مقدار ${attributeIndex + 1}`];
  return pool[(productIndex + attributeIndex) % pool.length];
}

export async function seedProducts(prisma: PrismaClient): Promise<number> {
  const files = await ensureFakeImageFiles(prisma);

  const categories = await prisma.category.findMany({
    where: { children: { none: {} } },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  if (!categories.length) {
    throw new Error('No leaf categories found. Run the "categories" seed first.');
  }

  const categoryAttributes = await prisma.categoryAttribute.findMany({
    select: { id: true, categoryId: true, attribute: { select: { name: true } } },
  });
  if (!categoryAttributes.length) {
    throw new Error('No category attributes found. Run the "attributes" seed first.');
  }

  const attributesByCategory = new Map<number, Array<{ id: number; name: string }>>();
  for (const link of categoryAttributes) {
    const list = attributesByCategory.get(link.categoryId) ?? [];
    list.push({ id: link.id, name: link.attribute.name });
    attributesByCategory.set(link.categoryId, list);
  }

  await prisma.product.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });

  await prisma.product.createMany({
    data: Array.from({ length: PRODUCT_COUNT }, (_, index) => {
      const number = index + 1;
      return {
        name: `محصول ${number}`,
        slug: `${SLUG_PREFIX}${number}`,
        description: `توضیحات نمونه برای محصول شماره ${number}.`,
      };
    }),
  });

  const created = await prisma.product.findMany({
    where: { slug: { startsWith: SLUG_PREFIX } },
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(created.map((product) => [product.slug, product.id]));
  const productIds = Array.from({ length: PRODUCT_COUNT }, (_, index) => idBySlug.get(`${SLUG_PREFIX}${index + 1}`)!);

  const productCategories = productIds.map((productId, index) => ({
    productId,
    categoryId: categories[index % categories.length].id,
  }));
  await prisma.productCategory.createMany({ data: productCategories });

  const productImages: Array<{
    productId: number;
    fileId: number;
    isPrimary: boolean;
    isThumbnail: boolean;
    sortOrder: number;
  }> = [];
  for (const [index, productId] of productIds.entries()) {
    for (let imageIndex = 0; imageIndex < IMAGES_PER_PRODUCT; imageIndex++) {
      const file = files[(index + imageIndex) % files.length];
      productImages.push({
        productId,
        fileId: file.id,
        isPrimary: imageIndex === 0,
        isThumbnail: imageIndex === 1,
        sortOrder: imageIndex,
      });
    }
  }
  await prisma.productImage.createMany({ data: productImages });

  const attributeValues = productIds.flatMap((productId, index) => {
    const categoryId = productCategories[index].categoryId;
    return (attributesByCategory.get(categoryId) ?? []).map((attribute, attributeIndex) => ({
      productId,
      categoryAttributeId: attribute.id,
      value: pickValue(attribute.name, index, attributeIndex),
    }));
  });
  await prisma.productAttributeValue.createMany({ data: attributeValues });

  const storedValues = await prisma.productAttributeValue.findMany({
    where: { productId: { in: productIds } },
    select: { id: true, productId: true },
  });
  const valuesByProduct = new Map<number, number[]>();
  for (const value of storedValues) {
    const list = valuesByProduct.get(value.productId) ?? [];
    list.push(value.id);
    valuesByProduct.set(value.productId, list);
  }

  const variants = productIds.flatMap((productId, index) => {
    const basePrice = 100000 + (((index + 1) * 7919) % 900000);
    return Array.from({ length: VARIANTS_PER_PRODUCT }, (_, variantIndex) => ({
      productId,
      sku: `${SKU_PREFIX}${index + 1}-${variantIndex + 1}`,
      price: basePrice + variantIndex * 10000,
      compareAtPrice: basePrice + variantIndex * 10000 + 50000,
      stock: (index * 7 + variantIndex * 3) % 50,
      position: variantIndex,
      isDefault: variantIndex === 0,
    }));
  });
  await prisma.productVariant.createMany({ data: variants });

  const storedVariants = await prisma.productVariant.findMany({
    where: { productId: { in: productIds } },
    select: { id: true, productId: true },
  });
  const variantAttributeValues = storedVariants.flatMap((variant) =>
    (valuesByProduct.get(variant.productId) ?? []).map((productAttributeValueId) => ({
      variantId: variant.id,
      productAttributeValueId,
    })),
  );
  await prisma.variantAttributeValue.createMany({ data: variantAttributeValues });

  return productIds.length;
}
