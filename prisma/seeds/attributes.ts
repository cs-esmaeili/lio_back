import { AttributeUsage, FilterType } from '../../src/generated/prisma/client';
import type { PrismaClient } from '../../src/generated/prisma/client';

const ATTRIBUTES: Array<{
  name: string;
  title: string;
  usage: AttributeUsage;
  filterType: FilterType;
  isMultiSelect: boolean;
}> = [
  { name: 'color', title: 'رنگ', usage: AttributeUsage.VARIANT, filterType: FilterType.CHECKBOX, isMultiSelect: true },
  { name: 'size', title: 'سایز', usage: AttributeUsage.VARIANT, filterType: FilterType.RADIO, isMultiSelect: false },
  { name: 'material', title: 'جنس', usage: AttributeUsage.SPEC, filterType: FilterType.CHECKBOX, isMultiSelect: true },
  { name: 'brand', title: 'برند', usage: AttributeUsage.SPEC, filterType: FilterType.SELECT, isMultiSelect: false },
];

const ATTRIBUTE_VALUES: Record<string, string[]> = {
  color: ['قرمز', 'آبی', 'سبز', 'مشکی', 'سفید'],
  size: ['S', 'M', 'L', 'XL'],
  material: ['نخ', 'پنبه', 'چرم', 'پلی‌استر'],
  brand: ['برند آ', 'برند ب', 'برند ج'],
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
      update: {
        title: definition.title,
        usage: definition.usage,
        filterType: definition.filterType,
        isMultiSelect: definition.isMultiSelect,
      },
      select: { id: true, name: true },
    });
    attributes.push(attribute);
  }

  for (const attribute of attributes) {
    for (const [sortOrder, value] of (ATTRIBUTE_VALUES[attribute.name] ?? []).entries()) {
      await prisma.attributeValue.upsert({
        where: { attributeId_value: { attributeId: attribute.id, value } },
        create: { attributeId: attribute.id, value, sortOrder },
        update: { sortOrder },
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
