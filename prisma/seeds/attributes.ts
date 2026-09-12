import { AttributeType } from '../../src/generated/prisma/client';
import type { PrismaClient } from '../../src/generated/prisma/client';

const ATTRIBUTES: Array<{ name: string; type: AttributeType }> = [
  { name: 'رنگ', type: AttributeType.SELECT },
  { name: 'سایز', type: AttributeType.SELECT },
  { name: 'جنس', type: AttributeType.TEXT },
  { name: 'برند', type: AttributeType.SELECT },
];

export async function seedAttributes(prisma: PrismaClient): Promise<number> {
  const categories = await prisma.category.findMany({ select: { id: true } });
  if (!categories.length) {
    throw new Error('No categories found. Run the "categories" seed first.');
  }

  const attributes: Array<{ id: number }> = [];
  for (const definition of ATTRIBUTES) {
    const existing = await prisma.attribute.findFirst({ where: { name: definition.name } });
    const attribute = existing ?? (await prisma.attribute.create({ data: definition, select: { id: true } }));
    attributes.push(attribute);
  }

  for (const category of categories) {
    for (const [sortOrder, attribute] of attributes.entries()) {
      await prisma.categoryAttribute.upsert({
        where: { categoryId_attributeId: { categoryId: category.id, attributeId: attribute.id } },
        create: {
          categoryId: category.id,
          attributeId: attribute.id,
          isRequired: sortOrder < 2,
          isFilterable: true,
          sortOrder,
        },
        update: {
          isRequired: sortOrder < 2,
          isFilterable: true,
          sortOrder,
        },
      });
    }
  }

  return categories.length * attributes.length;
}
