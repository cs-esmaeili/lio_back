import { categories } from '../schema';
import { ensureFakeImageFiles } from './fake-images';
import type { SeedDb } from './db';

interface CategoryNode {
  name: string;
  slug: string;
  children?: CategoryNode[];
}

const CATEGORY_TREE: CategoryNode[] = [
  {
    name: 'پوشاک',
    slug: 'clothing',
    children: [
      {
        name: 'مردانه',
        slug: 'men',
        children: [
          { name: 'پیراهن مردانه', slug: 'men-shirts' },
          { name: 'شلوار مردانه', slug: 'men-pants' },
        ],
      },
      {
        name: 'زنانه',
        slug: 'women',
        children: [
          { name: 'مانتو', slug: 'manteau' },
          { name: 'شال و روسری', slug: 'scarves' },
        ],
      },
      {
        name: 'بچگانه',
        slug: 'kids',
        children: [
          { name: 'تی‌شرت بچگانه', slug: 'kids-tshirts' },
          { name: 'شلوار بچگانه', slug: 'kids-pants' },
        ],
      },
    ],
  },
  {
    name: 'کالای دیجیتال',
    slug: 'digital',
    children: [
      {
        name: 'موبایل',
        slug: 'mobile',
        children: [
          { name: 'گوشی موبایل', slug: 'mobile-phones' },
          { name: 'لوازم جانبی موبایل', slug: 'mobile-accessories' },
        ],
      },
      {
        name: 'لپ‌تاپ',
        slug: 'laptop',
        children: [
          { name: 'لپ‌تاپ گیمینگ', slug: 'gaming-laptops' },
          { name: 'لپ‌تاپ اداری', slug: 'office-laptops' },
        ],
      },
      {
        name: 'صوتی و تصویری',
        slug: 'audio-video',
        children: [
          { name: 'هدفون', slug: 'headphones' },
          { name: 'اسپیکر', slug: 'speakers' },
        ],
      },
    ],
  },
  {
    name: 'خانه و آشپزخانه',
    slug: 'home-kitchen',
    children: [
      {
        name: 'آشپزخانه',
        slug: 'kitchen',
        children: [
          { name: 'قابلمه و تابه', slug: 'cookware' },
          { name: 'ظروف', slug: 'dishes' },
        ],
      },
      {
        name: 'دکوراسیون',
        slug: 'decor',
        children: [
          { name: 'آباژور', slug: 'lamps' },
          { name: 'تابلو', slug: 'wall-art' },
        ],
      },
      {
        name: 'لوازم خانگی',
        slug: 'home-appliances',
        children: [
          { name: 'جاروبرقی', slug: 'vacuum-cleaners' },
          { name: 'چای‌ساز', slug: 'tea-makers' },
        ],
      },
    ],
  },
  {
    name: 'زیبایی و سلامت',
    slug: 'beauty-health',
    children: [
      {
        name: 'آرایشی',
        slug: 'makeup',
        children: [
          { name: 'رژ لب', slug: 'lipstick' },
          { name: 'کرم پودر', slug: 'foundation' },
        ],
      },
      {
        name: 'مراقبت پوست',
        slug: 'skincare',
        children: [
          { name: 'ضد آفتاب', slug: 'sunscreen' },
          { name: 'سرم', slug: 'serum' },
        ],
      },
      {
        name: 'عطر و ادکلن',
        slug: 'fragrance',
        children: [
          { name: 'عطر مردانه', slug: 'men-fragrance' },
          { name: 'عطر زنانه', slug: 'women-fragrance' },
        ],
      },
    ],
  },
  {
    name: 'ورزش و سفر',
    slug: 'sports-travel',
    children: [
      {
        name: 'تجهیزات ورزشی',
        slug: 'sports-equipment',
        children: [
          { name: 'دمبل', slug: 'dumbbells' },
          { name: 'مت', slug: 'mats' },
        ],
      },
      {
        name: 'پوشاک ورزشی',
        slug: 'sportswear',
        children: [
          { name: 'کفش ورزشی', slug: 'sports-shoes' },
          { name: 'لباس ورزشی', slug: 'sports-clothing' },
        ],
      },
      {
        name: 'لوازم سفر',
        slug: 'travel-gear',
        children: [
          { name: 'چمدان', slug: 'luggage' },
          { name: 'کوله پشتی', slug: 'backpacks' },
        ],
      },
    ],
  },
];

export async function seedCategories(db: SeedDb): Promise<number> {
  const seedFiles = await ensureFakeImageFiles(db);
  let index = 0;
  let count = 0;

  const createLevel = async (nodes: CategoryNode[], parentId: number | null): Promise<void> => {
    for (const node of nodes) {
      const file = seedFiles[index % seedFiles.length];
      const [category] = await db
        .insert(categories)
        .values({ name: node.name, slug: node.slug, parentId, imageId: file.id })
        .onConflictDoUpdate({
          target: categories.slug,
          set: { name: node.name, parentId, imageId: file.id },
        })
        .returning({ id: categories.id });

      index++;
      count++;

      if (node.children?.length) {
        await createLevel(node.children, category.id);
      }
    }
  };

  await createLevel(CATEGORY_TREE, null);
  return count;
}
