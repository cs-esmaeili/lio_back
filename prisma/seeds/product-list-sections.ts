import type { PrismaClient } from '../../src/generated/prisma/client';
import { EntityType, PageSectionStatus, PageSectionType } from '../../src/generated/prisma/client';
import { PRODUCTS } from './products';

export async function seedProductListSections(prisma: PrismaClient): Promise<number> {
  const home = await prisma.page.upsert({
    where: { slug: 'home' },
    create: { slug: 'home', entityType: EntityType.HOME },
    update: {},
  });

  const products: Array<{ id: number }> = [];
  for (const product of PRODUCTS) {
    const row = await prisma.product.upsert({
      where: { slug: product.slug },
      create: product,
      update: { name: product.name, description: product.description },
    });
    products.push(row);
  }

  await prisma.pageSection.deleteMany({
    where: { pageId: home.id, type: PageSectionType.PRODUCT_LIST },
  });

  const section = await prisma.pageSection.create({
    data: { pageId: home.id, type: PageSectionType.PRODUCT_LIST, sortOrder: 0, status: PageSectionStatus.ACTIVE },
  });

  await prisma.productListSection.createMany({
    data: products.map((product, index) => ({
      sectionId: section.id,
      productId: product.id,
      sortOrder: index,
    })),
  });

  return products.length;
}
