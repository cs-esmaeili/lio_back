import { AttributeType } from '../../src/generated/prisma/client';
import type { PrismaClient } from '../../src/generated/prisma/client';

const ATTRIBUTES: Array<{ name: string; title: string; type: AttributeType }> = [
  { name: 'color', title: 'رنگ', type: AttributeType.SELECT },
  { name: 'size', title: 'سایز', type: AttributeType.SELECT },
  { name: 'material', title: 'جنس', type: AttributeType.TEXT },
  { name: 'brand', title: 'برند', type: AttributeType.SELECT },
];

// The option catalog of each attribute. `value` is the stable machine value stored
// on ProductAttributeValue.value and sent by the client; `title` is the display text.
const ATTRIBUTE_OPTIONS: Record<string, Array<{ value: string; title: string }>> = {
  color: [
    { value: 'red', title: 'قرمز' },
    { value: 'blue', title: 'آبی' },
    { value: 'green', title: 'سبز' },
    { value: 'black', title: 'مشکی' },
    { value: 'white', title: 'سفید' },
  ],
  size: [
    { value: 's', title: 'S' },
    { value: 'm', title: 'M' },
    { value: 'l', title: 'L' },
    { value: 'xl', title: 'XL' },
  ],
  material: [
    { value: 'thread', title: 'نخ' },
    { value: 'cotton', title: 'پنبه' },
    { value: 'leather', title: 'چرم' },
    { value: 'polyester', title: 'پلی‌استر' },
  ],
  brand: [
    { value: 'brand-a', title: 'برند آ' },
    { value: 'brand-b', title: 'برند ب' },
    { value: 'brand-c', title: 'برند ج' },
  ],
};

export async function seedAttributes(prisma: PrismaClient): Promise<number> {
  const categories = await prisma.category.findMany({ select: { id: true } });
  if (!categories.length) {
    throw new Error('No categories found. Run the "categories" seed first.');
  }

  const attributes: Array<{ id: number; name: string }> = [];
  for (const definition of ATTRIBUTES) {
    const attribute = await prisma.attribute.upsert({
      where: { name: definition.name },
      create: definition,
      update: { title: definition.title, type: definition.type },
      select: { id: true, name: true },
    });
    attributes.push(attribute);
  }

  for (const attribute of attributes) {
    for (const [sortOrder, option] of (ATTRIBUTE_OPTIONS[attribute.name] ?? []).entries()) {
      await prisma.attributeOption.upsert({
        where: { attributeId_value: { attributeId: attribute.id, value: option.value } },
        create: { attributeId: attribute.id, value: option.value, title: option.title, sortOrder },
        update: { title: option.title, sortOrder },
      });
    }
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
