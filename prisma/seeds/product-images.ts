import { randomBytes } from 'node:crypto';
import { link, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { PrismaClient } from '../../src/generated/prisma/client';

const SECTION_ID = 14;
const IMAGES_PER_PRODUCT = 3;
const TEST_PREFIX = 'test-pimg-';

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
    originalName: 'sample-photo.jpg',
  },
  {
    relPath: 'images/cbed162a8bacf4612558c06d74939321-8f227543.png',
    mimeType: 'image/png',
    ext: '.png',
    size: 4191020,
    originalName: 'sample-graphic.png',
  },
];

export async function seedProductImages(prisma: PrismaClient): Promise<number> {
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  const imagesDir = join(uploadsDir, 'images');
  await mkdir(imagesDir, { recursive: true });

  const rows = await prisma.productListSection.findMany({
    where: { sectionId: SECTION_ID },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { productId: true },
  });
  const productIds = [...new Set(rows.map((row) => row.productId))];

  const existing = await prisma.productImage.findMany({
    where: { productId: { in: productIds } },
    select: { id: true, file: { select: { id: true, path: true, storedName: true } } },
  });
  const stale = existing.filter((image) => image.file.storedName.startsWith(TEST_PREFIX));

  await prisma.productImage.deleteMany({ where: { id: { in: stale.map((image) => image.id) } } });
  await prisma.file.deleteMany({ where: { id: { in: stale.map((image) => image.file.id) } } });
  for (const image of stale) {
    await rm(join(uploadsDir, image.file.path), { force: true });
  }

  let count = 0;
  for (const productId of productIds) {
    for (let index = 0; index < IMAGES_PER_PRODUCT; index++) {
      const source = SOURCES[index % SOURCES.length];
      const storedName = `${TEST_PREFIX}${productId}-${index}-${randomBytes(4).toString('hex')}${source.ext}`;
      const relPath = `images/${storedName}`;

      await link(join(uploadsDir, source.relPath), join(imagesDir, storedName));

      const file = await prisma.file.create({
        data: {
          originalName: source.originalName,
          storedName,
          path: relPath,
          mimeType: source.mimeType,
          size: source.size,
        },
      });

      await prisma.productImage.create({
        data: {
          productId,
          fileId: file.id,
          isPrimary: index === 0,
          isThumbnail: index === 1,
          sortOrder: index,
        },
      });

      count++;
    }
  }

  return count;
}
