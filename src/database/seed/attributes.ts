import { AttributeUsage, FilterType, attributeValues, attributes as attributesTable, categoryAttributes } from '../schema';
import type { SeedDb } from './db';

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

export async function seedAttributes(db: SeedDb): Promise<number> {
  const categoryRows = await db.query.categories.findMany({ columns: { id: true } });
  if (!categoryRows.length) {
    throw new Error('No categories found. Run the "categories" seed first.');
  }

  const seededAttributes: Array<{ id: number; name: string }> = [];
  for (const definition of ATTRIBUTES) {
    const [attribute] = await db
      .insert(attributesTable)
      .values(definition)
      .onConflictDoUpdate({
        target: attributesTable.name,
        set: {
          title: definition.title,
          usage: definition.usage,
          filterType: definition.filterType,
          isMultiSelect: definition.isMultiSelect,
        },
      })
      .returning({ id: attributesTable.id, name: attributesTable.name });
    seededAttributes.push(attribute);
  }

  for (const attribute of seededAttributes) {
    for (const [sortOrder, value] of (ATTRIBUTE_VALUES[attribute.name] ?? []).entries()) {
      await db
        .insert(attributeValues)
        .values({ attributeId: attribute.id, value, sortOrder })
        .onConflictDoUpdate({
          target: [attributeValues.attributeId, attributeValues.value],
          set: { sortOrder },
        });
    }
  }

  for (const category of categoryRows) {
    for (const [sortOrder, attribute] of seededAttributes.entries()) {
      await db
        .insert(categoryAttributes)
        .values({
          categoryId: category.id,
          attributeId: attribute.id,
          isRequired: sortOrder < 2,
          isFilterable: true,
          sortOrder,
        })
        .onConflictDoUpdate({
          target: [categoryAttributes.categoryId, categoryAttributes.attributeId],
          set: {
            isRequired: sortOrder < 2,
            isFilterable: true,
            sortOrder,
          },
        });
    }
  }

  return categoryRows.length * seededAttributes.length;
}
