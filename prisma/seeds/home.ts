import { EntityType, PageSectionStatus, PageSectionType } from '../../src/generated/prisma/client';
import type { PrismaClient } from '../../src/generated/prisma/client';
import { ensureFakeImageFiles } from './fake-images';

const HOME_SLUG = 'home';
const SLIDE_COUNT = 3;
const PRODUCTS_PER_LIST = 8;

interface BannerSeed {
  title: string;
  subtitle: string;
  buttonTitle: string;
  buttonUrl: string;
}

const FEATURED_BANNERS: BannerSeed[] = [
  { title: 'پیشنهاد ویژه', subtitle: 'تا ۵۰٪ تخفیف روی کالاهای منتخب', buttonTitle: 'همین حالا بخرید', buttonUrl: '/products' },
  { title: 'جدیدترین‌ها', subtitle: 'تازه‌ترین محصولات دیجیتال', buttonTitle: 'مشاهده', buttonUrl: '/products/new' },
  { title: 'ارسال رایگان', subtitle: 'برای سفارش‌های بالای ۵۰۰ هزار تومان', buttonTitle: 'بیشتر بدانید', buttonUrl: '/shipping' },
  { title: 'ضمانت اصالت', subtitle: 'تضمین اصل بودن تمام کالاها', buttonTitle: 'اطلاعات بیشتر', buttonUrl: '/guarantee' },
];

const COLLECTION_BANNERS: BannerSeed[] = [
  { title: 'گوشی موبایل', subtitle: 'پرچمداران دنیای موبایل', buttonTitle: 'مشاهده', buttonUrl: '/categories/mobile' },
  { title: 'لپ‌تاپ گیمینگ', subtitle: 'قدرت و سرعت بی‌نظیر', buttonTitle: 'خرید', buttonUrl: '/categories/laptop' },
  { title: 'لوازم خانگی', subtitle: 'هر آنچه خانه شما نیاز دارد', buttonTitle: 'مشاهده', buttonUrl: '/categories/home' },
];

const INTRODUCTION_TITLES: Record<string, string> = {
  eyebrow: 'درباره لیو',
  title: 'فناوری‌ای که با زندگی شما هماهنگ است',
  subtitle: 'تجربه خرید ساده، سریع و مطمئن',
  description: 'ما بهترین محصولات را با ضمانت اصالت و ارسال سریع به دست شما می‌رسانیم.',
  highlight: 'بیش از ۱۰٬۰۰۰ مشتری راضی',
  cta: 'بیشتر بدانید',
};

export async function seedHome(prisma: PrismaClient): Promise<number> {
  const [image] = await ensureFakeImageFiles(prisma, 'sliders');

  const products = await prisma.product.findMany({
    where: { slug: { startsWith: 'seed-product-' } },
    orderBy: { id: 'asc' },
    select: { id: true, slug: true },
  });
  if (products.length < PRODUCTS_PER_LIST) {
    throw new Error('Not enough products found. Run the "products" seed first.');
  }

  const home = await prisma.page.upsert({
    where: { slug: HOME_SLUG },
    create: { slug: HOME_SLUG, entityType: EntityType.HOME },
    update: {},
  });

  await prisma.pageSection.deleteMany({ where: { pageId: home.id } });

  const createBannerSection = async (sortOrder: number, banners: BannerSeed[]): Promise<void> => {
    const section = await prisma.pageSection.create({
      data: { pageId: home.id, type: PageSectionType.BANNER, sortOrder, status: PageSectionStatus.ACTIVE },
      select: { id: true },
    });
    await prisma.bannerSection.createMany({
      data: banners.map((banner, index) => ({
        sectionId: section.id,
        sortOrder: index,
        title: banner.title,
        subtitle: banner.subtitle,
        buttonTitle: banner.buttonTitle,
        buttonUrl: banner.buttonUrl,
        desktopFileId: image.id,
        tabletFileId: image.id,
        mobileFileId: image.id,
      })),
    });
  };

  const createProductListSection = async (sortOrder: number, selection: typeof products): Promise<void> => {
    const section = await prisma.pageSection.create({
      data: { pageId: home.id, type: PageSectionType.PRODUCT_LIST, sortOrder, status: PageSectionStatus.ACTIVE },
      select: { id: true },
    });
    await prisma.productListSection.createMany({
      data: selection.map((product, index) => ({ sectionId: section.id, productId: product.id, sortOrder: index })),
    });
  };

  // 0. Slider
  const slider = await prisma.pageSection.create({
    data: { pageId: home.id, type: PageSectionType.SLIDER, sortOrder: 0, status: PageSectionStatus.ACTIVE },
    select: { id: true },
  });
  await prisma.sliderSection.createMany({
    data: Array.from({ length: SLIDE_COUNT }, (_, index) => ({
      sectionId: slider.id,
      sortOrder: index,
      desktopFileId: image.id,
      tabletFileId: image.id,
      mobileFileId: image.id,
      url: `/products/${products[index].slug}`,
    })),
  });

  // 1. Amazing products
  await createProductListSection(1, products.slice(0, PRODUCTS_PER_LIST));

  // 2. Four banners
  await createBannerSection(2, FEATURED_BANNERS);

  // 3. New products
  await createProductListSection(3, products.slice(-PRODUCTS_PER_LIST));

  // 4. Three banners
  await createBannerSection(4, COLLECTION_BANNERS);

  // 5. Introduction
  const introduction = await prisma.pageSection.create({
    data: { pageId: home.id, type: PageSectionType.INTRODUCTION, sortOrder: 5, status: PageSectionStatus.ACTIVE },
    select: { id: true },
  });
  await prisma.introductionSection.create({
    data: {
      sectionId: introduction.id,
      titles: INTRODUCTION_TITLES,
      desktopFileId: image.id,
      tabletFileId: image.id,
      mobileFileId: image.id,
    },
  });

  return 6;
}
