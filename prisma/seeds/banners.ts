import { randomBytes } from 'node:crypto';
import { link, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { PrismaClient } from '../../src/generated/prisma/client';
import { EntityType, PageSectionStatus, PageSectionType } from '../../src/generated/prisma/client';

const PAGE_SLUG = 'home';
const TEST_PREFIX = 'test-banner-';

type SourceImage = {
  relPath: string;
  mimeType: string;
  ext: string;
  size: number;
  originalName: string;
};

const SOURCES: SourceImage[] = [
  {
    relPath: 'e079f5d8018f040f02dbc93d210b7a16-99e3c18c.jpg',
    mimeType: 'image/jpeg',
    ext: '.jpg',
    size: 2640877,
    originalName: 'banner-sample.jpg',
  },
  {
    relPath: 'images/cbed162a8bacf4612558c06d74939321-8f227543.png',
    mimeType: 'image/png',
    ext: '.png',
    size: 4191020,
    originalName: 'banner-sample.png',
  },
];

const BANNERS = [
  {
    title: 'Summer Sale',
    subtitle: 'Up to 50% off selected items',
    buttonTitle: 'Shop now',
    buttonUrl: '/products/summer-sale',
  },
  {
    title: 'New Arrivals',
    subtitle: 'Discover the latest tech gear',
    buttonTitle: 'Explore',
    buttonUrl: '/products/new',
  },
  {
    title: 'Free Shipping',
    subtitle: 'On all orders over $50',
    buttonTitle: 'Learn more',
    buttonUrl: '/shipping',
  },
];

export async function seedBanners(prisma: PrismaClient): Promise<number> {
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  const imagesDir = join(uploadsDir, 'images');
  await mkdir(imagesDir, { recursive: true });

  const home = await prisma.page.upsert({
    where: { slug: PAGE_SLUG },
    create: { slug: PAGE_SLUG, entityType: EntityType.HOME },
    update: {},
  });

  const existing = await prisma.bannerSection.findMany({
    where: { section: { pageId: home.id, type: PageSectionType.BANNER } },
    select: {
      desktopFile: { select: { id: true, path: true, storedName: true } },
      tabletFile: { select: { id: true, path: true, storedName: true } },
      mobileFile: { select: { id: true, path: true, storedName: true } },
    },
  });

  const staleFiles = new Map<number, { path: string; storedName: string }>();
  for (const banner of existing) {
    for (const file of [banner.desktopFile, banner.tabletFile, banner.mobileFile]) {
      if (file.storedName.startsWith(TEST_PREFIX)) {
        staleFiles.set(file.id, { path: file.path, storedName: file.storedName });
      }
    }
  }

  await prisma.pageSection.deleteMany({ where: { pageId: home.id, type: PageSectionType.BANNER } });
  await prisma.file.deleteMany({ where: { id: { in: [...staleFiles.keys()] } } });
  for (const file of staleFiles.values()) {
    await rm(join(uploadsDir, file.path), { force: true });
  }

  const section = await prisma.pageSection.create({
    data: { pageId: home.id, type: PageSectionType.BANNER, sortOrder: 1, status: PageSectionStatus.ACTIVE },
  });

  const createFile = async (source: SourceImage, tag: string) => {
    const storedName = `${TEST_PREFIX}${tag}-${randomBytes(4).toString('hex')}${source.ext}`;
    const relPath = `images/${storedName}`;
    await link(join(uploadsDir, source.relPath), join(imagesDir, storedName));
    return prisma.file.create({
      data: {
        originalName: source.originalName,
        storedName,
        path: relPath,
        mimeType: source.mimeType,
        size: source.size,
      },
    });
  };

  let count = 0;
  for (let index = 0; index < BANNERS.length; index++) {
    const banner = BANNERS[index];
    const [desktopFile, tabletFile, mobileFile] = await Promise.all([
      createFile(SOURCES[0], `d${index}`),
      createFile(SOURCES[1], `t${index}`),
      createFile(SOURCES[0], `m${index}`),
    ]);

    await prisma.bannerSection.create({
      data: {
        sectionId: section.id,
        sortOrder: index,
        title: banner.title,
        subtitle: banner.subtitle,
        buttonTitle: banner.buttonTitle,
        buttonUrl: banner.buttonUrl,
        desktopFileId: desktopFile.id,
        tabletFileId: tabletFile.id,
        mobileFileId: mobileFile.id,
      },
    });

    count++;
  }

  return count;
}
