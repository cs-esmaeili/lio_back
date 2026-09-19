import { createHash } from 'node:crypto';
import { copyFile, link, mkdir, readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { files } from '../schema';
import type { SeedDb } from './db';

const FAKE_IMAGES_ROOT = join(process.cwd(), 'src', 'database', 'seed', 'fake-images');
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? join(process.cwd(), 'public', 'uploads');
const SEED_IMAGE_DIR = 'seed';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

interface FakeImage {
  originalName: string;
  mimeType: string;
  ext: string;
  size: number;
  hash: string;
  sourcePath: string;
}

export interface SeedImageFile {
  id: number;
  path: string;
}

async function loadFakeImages(subdir: string): Promise<FakeImage[]> {
  const imagesDir = join(FAKE_IMAGES_ROOT, subdir);
  const entries = await readdir(imagesDir, { withFileTypes: true });
  const images: FakeImage[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = extname(entry.name).toLowerCase();
    const mimeType = MIME_TYPES[ext];
    if (!mimeType) continue;

    const sourcePath = join(imagesDir, entry.name);
    const buffer = await readFile(sourcePath);
    images.push({
      originalName: entry.name,
      mimeType,
      ext,
      size: buffer.length,
      hash: createHash('sha256').update(buffer).digest('hex').slice(0, 8),
      sourcePath,
    });
  }

  if (!images.length) {
    throw new Error(`No images found in ${imagesDir}`);
  }

  images.sort((a, b) => a.originalName.localeCompare(b.originalName));
  return images;
}

/**
 * Copies each image from `src/database/seed/fake-images/<subdir>` into the uploads
 * directory exactly once and upserts a single File row per image. Returns the shared
 * file records that all seeders reuse (no per-entity copies).
 */
export async function ensureFakeImageFiles(db: SeedDb, subdir = 'products'): Promise<SeedImageFile[]> {
  const images = await loadFakeImages(subdir);
  const targetDir = join(UPLOADS_DIR, SEED_IMAGE_DIR);
  await mkdir(targetDir, { recursive: true });

  const seedFiles: SeedImageFile[] = [];
  for (const image of images) {
    const storedName = `seed-fake-${image.hash}${image.ext}`;
    const targetPath = join(targetDir, storedName);

    try {
      await link(image.sourcePath, targetPath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'EXDEV') {
        await copyFile(image.sourcePath, targetPath);
      } else if (code !== 'EEXIST') {
        throw error;
      }
    }

    const relPath = `${SEED_IMAGE_DIR}/${storedName}`;
    const [file] = await db
      .insert(files)
      .values({
        originalName: image.originalName,
        storedName,
        path: relPath,
        mimeType: image.mimeType,
        size: image.size,
      })
      .onConflictDoUpdate({
        target: files.storedName,
        set: {
          path: relPath,
          mimeType: image.mimeType,
          size: image.size,
        },
      })
      .returning();

    seedFiles.push({ id: file.id, path: file.path });
  }

  return seedFiles;
}
