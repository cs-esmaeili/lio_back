import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUrlService } from 'src/common/services/file-url.service';
import type { CategoryDto, GetCategoriesResponseDto } from '../dtos/getCategories/get-categories-response.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUrl: FileUrlService,
  ) {}

  async getCategories(): Promise<GetCategoriesResponseDto> {
    const rows = await this.prisma.category.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        parentId: true,
        name: true,
        slug: true,
        image: { select: { path: true } },
      },
    });

    const nodes = new Map<number, CategoryDto>();
    for (const row of rows) {
      nodes.set(row.id, {
        id: row.id,
        name: row.name,
        slug: row.slug,
        imageUrl: this.fileUrl.toUrl(row.image?.path ?? null),
        children: [],
      });
    }

    const categories: CategoryDto[] = [];
    for (const row of rows) {
      const node = nodes.get(row.id)!;
      const parent = row.parentId !== null ? nodes.get(row.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        categories.push(node);
      }
    }

    return { categories };
  }
}
