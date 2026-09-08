import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Prisma } from 'src/generated/prisma/client';
import type { UpdateSliderSectionDto } from '../dtos/updateSectionData/update-section-data-request.dto';

@Injectable()
export class SliderSectionService {
  constructor(private readonly prisma: PrismaService) {}

  create(sectionId: number, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.sliderSection.create({ data: { sectionId } });
  }

  async get(sectionId: number) {
    const slider = await this.prisma.sliderSection.findUnique({ where: { sectionId } });
    if (!slider) {
      throw new NotFoundException('Slider section not found');
    }
    return slider;
  }

  async update(sectionId: number, data: UpdateSliderSectionDto) {
    await this.validateFiles(data);

    return this.prisma.sliderSection.update({
      where: { sectionId },
      data: {
        ...(data.desktopFileId !== undefined && { desktopFileId: data.desktopFileId }),
        ...(data.tabletFileId !== undefined && { tabletFileId: data.tabletFileId }),
        ...(data.mobileFileId !== undefined && { mobileFileId: data.mobileFileId }),
      },
    });
  }

  private async validateFiles(data: UpdateSliderSectionDto) {
    const ids = [...new Set([data.desktopFileId, data.tabletFileId, data.mobileFileId].filter((id): id is number => id !== undefined && id !== null))];

    if (ids.length === 0) {
      return;
    }

    const count = await this.prisma.file.count({ where: { id: { in: ids } } });
    if (count !== ids.length) {
      throw new BadRequestException('One or more referenced files do not exist');
    }
  }
}
