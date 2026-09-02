import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

export interface UploadedFileInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface FileRecord {
  id: number;
  originalName: string;
  storedName: string;
  path: string;
  mimeType: string;
  size: number;
  uploaderId: number | null;
  createdAt: Date;
}

export interface FolderEntry {
  type: 'folder';
  name: string;
  path: string;
}

export interface FileEntry {
  type: 'file';
  name: string;
  path: string;
  id?: number;
  size?: number;
  mimeType?: string;
  url: string;
  createdAt?: string;
}

export interface DirectoryListing {
  path: string;
  entries: Array<FolderEntry | FileEntry>;
}

@Injectable()
export class FileManagerService {
  private readonly uploadsDir: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.uploadsDir = config.getOrThrow<string>('uploads.uploadsDir');
  }

  async listFiles(relativePath: string): Promise<DirectoryListing> {
    const rel = this.normalizeRelative(relativePath);
    const dir = this.resolveSafe(rel);

    let dirents: Dirent[];
    try {
      dirents = await readdir(dir, { withFileTypes: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException('Folder not found');
      }
      throw err;
    }

    const folders: FolderEntry[] = [];
    const fileDirents: Array<{ name: string; path: string }> = [];
    for (const dirent of dirents) {
      const entryPath = this.joinRelative(rel, dirent.name);
      if (dirent.isDirectory()) {
        folders.push({ type: 'folder', name: dirent.name, path: entryPath });
      } else if (dirent.isFile()) {
        fileDirents.push({ name: dirent.name, path: entryPath });
      }
    }

    const records = fileDirents.length
      ? await this.prisma.file.findMany({
          where: { storedName: { in: fileDirents.map((f) => f.name) } },
        })
      : [];
    const byStoredName = new Map(records.map((record) => [record.storedName, record]));

    const files: FileEntry[] = fileDirents.map((file) => {
      const record = byStoredName.get(file.name);
      return {
        type: 'file',
        name: record?.originalName ?? file.name,
        path: file.path,
        id: record?.id,
        size: record?.size,
        mimeType: record?.mimeType,
        url: `/uploads/${file.path}`,
        createdAt: record?.createdAt.toISOString(),
      };
    });

    return { path: rel, entries: [...folders, ...files] };
  }

  async uploadFiles(files: UploadedFileInput[], relativePath: string, uploaderId: number): Promise<FileRecord[]> {
    const rel = this.normalizeRelative(relativePath);
    const dir = this.resolveSafe(rel);
    await mkdir(dir, { recursive: true });

    const created: FileRecord[] = [];
    for (const file of files) {
      const storedName = this.buildStoredName(file.originalname, file.buffer);
      const filePath = this.joinRelative(rel, storedName);
      await writeFile(join(dir, storedName), file.buffer);
      const record = await this.prisma.file.create({
        data: {
          originalName: file.originalname,
          storedName,
          path: filePath,
          mimeType: file.mimetype,
          size: file.size,
          uploaderId,
        },
      });
      created.push(record);
    }
    return created;
  }

  async deleteFile(id: number) {
    const record = await this.prisma.file.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException('File not found');
    }
    await rm(this.resolveSafe(record.path), { force: true });
    await this.prisma.file.delete({ where: { id } });
    return { ok: true };
  }

  async createFolder(relativePath: string) {
    const rel = this.normalizeRelative(relativePath);
    await mkdir(this.resolveSafe(rel), { recursive: true });
    return { ok: true, path: rel };
  }

  async deleteFolder(relativePath: string) {
    const rel = this.normalizeRelative(relativePath);
    const dir = this.resolveSafe(rel);
    if (dir === resolve(this.uploadsDir)) {
      throw new BadRequestException('Cannot delete the uploads root folder');
    }
    await rm(dir, { recursive: true, force: true });
    await this.prisma.file.deleteMany({
      where: { path: { startsWith: `${rel}/` } },
    });
    return { ok: true };
  }

  private resolveSafe(relativePath: string): string {
    const base = resolve(this.uploadsDir);
    const target = resolve(base, relativePath);
    if (target !== base && !target.startsWith(`${base}/`)) {
      throw new BadRequestException('Invalid path');
    }
    return target;
  }

  private normalizeRelative(relativePath: string): string {
    const normalized = normalize(relativePath ?? '')
      .replace(/^[/\\]+/, '')
      .replace(/[\\/]+$/, '');
    return normalized === '.' ? '' : normalized;
  }

  private joinRelative(parent: string, name: string): string {
    return parent ? `${parent}/${name}` : name;
  }

  private buildStoredName(originalName: string, buffer: Buffer): string {
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 32);
    const suffix = randomBytes(4).toString('hex');
    const ext = extname(originalName)
      .toLowerCase()
      .replace(/[^.a-z0-9]/g, '');
    return `${hash}-${suffix}${ext}`;
  }
}
