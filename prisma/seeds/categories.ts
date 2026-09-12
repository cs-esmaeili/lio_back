import type { PrismaClient } from '../../src/generated/prisma/client';
import { ensureFakeImageFiles } from './fake-images';

interface CategoryNode {
  name: string;
  children?: CategoryNode[];
}

const CATEGORY_TREE: CategoryNode[] = [
  {
    name: 'پوشاک',
    children: [
      {
        name: 'مردانه',
        children: [{ name: 'پیراهن مردانه' }, { name: 'شلوار مردانه' }],
      },
      {
        name: 'زنانه',
        children: [{ name: 'مانتو' }, { name: 'شال و روسری' }],
      },
      {
        name: 'بچگانه',
        children: [{ name: 'تی‌شرت بچگانه' }, { name: 'شلوار بچگانه' }],
      },
    ],
  },
  {
    name: 'کالای دیجیتال',
    children: [
      {
        name: 'موبایل',
        children: [{ name: 'گوشی موبایل' }, { name: 'لوازم جانبی موبایل' }],
      },
      {
        name: 'لپ‌تاپ',
        children: [{ name: 'لپ‌تاپ گیمینگ' }, { name: 'لپ‌تاپ اداری' }],
      },
      {
        name: 'صوتی و تصویری',
        children: [{ name: 'هدفون' }, { name: 'اسپیکر' }],
      },
    ],
  },
  {
    name: 'خانه و آشپزخانه',
    children: [
      {
        name: 'آشپزخانه',
        children: [{ name: 'قابلمه و تابه' }, { name: 'ظروف' }],
      },
      {
        name: 'دکوراسیون',
        children: [{ name: 'آباژور' }, { name: 'تابلو' }],
      },
      {
        name: 'لوازم خانگی',
        children: [{ name: 'جاروبرقی' }, { name: 'چای‌ساز' }],
      },
    ],
  },
  {
    name: 'زیبایی و سلامت',
    children: [
      {
        name: 'آرایشی',
        children: [{ name: 'رژ لب' }, { name: 'کرم پودر' }],
      },
      {
        name: 'مراقبت پوست',
        children: [{ name: 'ضد آفتاب' }, { name: 'سرم' }],
      },
      {
        name: 'عطر و ادکلن',
        children: [{ name: 'عطر مردانه' }, { name: 'عطر زنانه' }],
      },
    ],
  },
  {
    name: 'ورزش و سفر',
    children: [
      {
        name: 'تجهیزات ورزشی',
        children: [{ name: 'دمبل' }, { name: 'مت' }],
      },
      {
        name: 'پوشاک ورزشی',
        children: [{ name: 'کفش ورزشی' }, { name: 'لباس ورزشی' }],
      },
      {
        name: 'لوازم سفر',
        children: [{ name: 'چمدان' }, { name: 'کوله پشتی' }],
      },
    ],
  },
];

export async function seedCategories(prisma: PrismaClient): Promise<number> {
  const files = await ensureFakeImageFiles(prisma);
  let index = 0;
  let count = 0;

  const createLevel = async (nodes: CategoryNode[], parentId: number | null): Promise<void> => {
    for (const node of nodes) {
      const existing = await prisma.category.findFirst({
        where: { name: node.name, parentId },
        select: { id: true },
      });

      let categoryId: number;
      if (existing) {
        categoryId = existing.id;
      } else {
        const file = files[index % files.length];
        const category = await prisma.category.create({
          data: { name: node.name, parentId, imageId: file.id },
          select: { id: true },
        });
        categoryId = category.id;
      }

      index++;
      count++;

      if (node.children?.length) {
        await createLevel(node.children, categoryId);
      }
    }
  };

  await createLevel(CATEGORY_TREE, null);
  return count;
}
