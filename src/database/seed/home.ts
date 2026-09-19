import { asc, eq, like } from 'drizzle-orm';
import {
  EntityType,
  PageSectionLocation,
  PageSectionStatus,
  PageSectionType,
  bannerSections,
  introductionSections,
  pageSections,
  pages,
  productListSections,
  products,
  sliderSections,
} from '../schema';
import { ensureFakeImageFiles } from './fake-images';
import type { SeedDb } from './db';

const HOME_SLUG = 'home';
const SLIDE_COUNT = 3;
const PRODUCTS_PER_LIST = 8;
const SECTION_LINK = '/blog';

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

export async function seedHome(db: SeedDb): Promise<number> {
  const [image] = await ensureFakeImageFiles(db, 'sliders');

  const productRows = await db.query.products.findMany({
    where: like(products.slug, 'seed-product-%'),
    orderBy: asc(products.id),
    columns: { id: true, slug: true },
  });
  if (productRows.length < PRODUCTS_PER_LIST) {
    throw new Error('Not enough products found. Run the "products" seed first.');
  }

  const [home] = await db
    .insert(pages)
    .values({ slug: HOME_SLUG, entityType: EntityType.HOME })
    .onConflictDoUpdate({ target: pages.slug, set: { entityType: EntityType.HOME } })
    .returning();

  await db.delete(pageSections).where(eq(pageSections.pageId, home.id));

  const createBannerSection = async (sortOrder: number, banners: BannerSeed[], location: PageSectionLocation, title: string): Promise<void> => {
    const [section] = await db
      .insert(pageSections)
      .values({ pageId: home.id, type: PageSectionType.BANNER, location, title, link: SECTION_LINK, sortOrder, status: PageSectionStatus.ACTIVE })
      .returning({ id: pageSections.id });
    await db.insert(bannerSections).values(
      banners.map((banner, index) => ({
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
    );
  };

  const createProductListSection = async (sortOrder: number, selection: Array<{ id: number; slug: string }>, location: PageSectionLocation, title: string): Promise<void> => {
    const [section] = await db
      .insert(pageSections)
      .values({ pageId: home.id, type: PageSectionType.PRODUCT_LIST, location, title, link: SECTION_LINK, sortOrder, status: PageSectionStatus.ACTIVE })
      .returning({ id: pageSections.id });
    await db.insert(productListSections).values(selection.map((product, index) => ({ sectionId: section.id, productId: product.id, sortOrder: index })));
  };

  // 0. Slider
  const [slider] = await db
    .insert(pageSections)
    .values({
      pageId: home.id,
      type: PageSectionType.SLIDER,
      location: PageSectionLocation.SLIDER,
      title: 'اسلایدر اصلی',
      link: SECTION_LINK,
      sortOrder: 0,
      status: PageSectionStatus.ACTIVE,
    })
    .returning({ id: pageSections.id });
  await db.insert(sliderSections).values(
    Array.from({ length: SLIDE_COUNT }, (_, index) => ({
      sectionId: slider.id,
      sortOrder: index,
      desktopFileId: image.id,
      tabletFileId: image.id,
      mobileFileId: image.id,
      url: `/products/${productRows[index].slug}`,
    })),
  );

  // 1. Amazing products
  await createProductListSection(1, productRows.slice(0, PRODUCTS_PER_LIST), PageSectionLocation.AMAZING_PRODUCTS, 'محصولات شگفت‌انگیز');

  // 2. Four banners
  await createBannerSection(2, FEATURED_BANNERS, PageSectionLocation.BANNER_4, 'پیشنهادهای ویژه');

  // 3. New products
  await createProductListSection(3, productRows.slice(-PRODUCTS_PER_LIST), PageSectionLocation.PRODUCT_LIST, 'جدیدترین محصولات');

  // 4. Three banners
  await createBannerSection(4, COLLECTION_BANNERS, PageSectionLocation.BANNER_3, 'خرید بر اساس دسته‌بندی');

  // 5. Introduction
  const [introduction] = await db
    .insert(pageSections)
    .values({
      pageId: home.id,
      type: PageSectionType.INTRODUCTION,
      location: PageSectionLocation.INTRODUCTION,
      title: 'درباره لیو',
      link: SECTION_LINK,
      sortOrder: 5,
      status: PageSectionStatus.ACTIVE,
    })
    .returning({ id: pageSections.id });
  await db.insert(introductionSections).values({
    sectionId: introduction.id,
    titles: INTRODUCTION_TITLES,
    desktopFileId: image.id,
    tabletFileId: image.id,
    mobileFileId: image.id,
  });

  return 6;
}
