import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SECTION_SCHEMAS } from '../section-schemas';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome() {
    const page = await this.prisma.page.findUnique({
      where: { slug: 'home' },
      include: {
        sections: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page) {
      return { slug: 'home', sections: [] };
    }

    const sections = page.sections.map((section) => {
      const schema = SECTION_SCHEMAS[section.type];
      const data = schema ? schema.map(section.data) : (section.data as Record<string, unknown> | null);
      return {
        id: section.id,
        type: section.type,
        title: section.title,
        sortOrder: section.sortOrder,
        isActive: section.isActive,
        data,
      };
    });

    return { slug: page.slug, sections };
  }
}
