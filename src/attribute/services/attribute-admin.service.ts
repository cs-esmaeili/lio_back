import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { attributeValues, attributes, productAttributeValues } from 'src/database/schema';
import { AdminAttributeDto } from '../dtos/adminAttribute/admin-attribute.dto';
import type { CreateAttributeRequestDto } from '../dtos/adminAttribute/create-attribute-request.dto';
import type { CreateAttributeValueRequestDto } from '../dtos/adminAttribute/create-attribute-value-request.dto';
import type { DeleteAttributeResponseDto } from '../dtos/adminAttribute/delete-attribute-response.dto';
import type { UpdateAttributeRequestDto } from '../dtos/adminAttribute/update-attribute-request.dto';
import type { UpdateAttributeValueRequestDto } from '../dtos/adminAttribute/update-attribute-value-request.dto';

type AttributeRow = typeof attributes.$inferSelect;
type ValueRow = typeof attributeValues.$inferSelect;

/**
 * Admin CRUD for product attributes and their values (`/admin/attributes`).
 *
 * An attribute is either a `SPEC` (a fixed product description such as brand)
 * or a `VARIANT` (an axis whose combinations each get their own price/stock).
 * Attributes are linked to categories separately, so deleting one that is in
 * use by a product is rejected instead of silently dropping that product data.
 */
@Injectable()
export class AttributeAdminService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listAttributes(): Promise<AdminAttributeDto[]> {
    const rows = await this.db.query.attributes.findMany({
      orderBy: asc(attributes.id),
      with: { values: { orderBy: [asc(attributeValues.sortOrder), asc(attributeValues.id)] } },
    });

    return rows.map((row) => this.toDto(row, row.values));
  }

  async getAttribute(id: number): Promise<AdminAttributeDto> {
    return this.loadAttribute(id);
  }

  async createAttribute(dto: CreateAttributeRequestDto): Promise<AdminAttributeDto> {
    await this.assertNameAvailable(dto.name);

    const [created] = await this.db
      .insert(attributes)
      .values({
        name: dto.name,
        title: dto.title.trim(),
        usage: dto.usage,
        filterType: dto.filterType,
        isMultiSelect: dto.isMultiSelect,
      })
      .returning({ id: attributes.id });

    return this.loadAttribute(created.id);
  }

  async updateAttribute(id: number, dto: UpdateAttributeRequestDto): Promise<AdminAttributeDto> {
    const existing = await this.findAttributeOrFail(id);

    if (dto.name !== undefined && dto.name !== existing.name) {
      await this.assertNameAvailable(dto.name, id);
    }

    const patch: Partial<typeof attributes.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.usage !== undefined) patch.usage = dto.usage;
    if (dto.filterType !== undefined) patch.filterType = dto.filterType;
    if (dto.isMultiSelect !== undefined) patch.isMultiSelect = dto.isMultiSelect;

    if (Object.keys(patch).length > 0) {
      await this.db.update(attributes).set(patch).where(eq(attributes.id, id));
    }

    return this.loadAttribute(id);
  }

  async deleteAttribute(id: number): Promise<DeleteAttributeResponseDto> {
    await this.findAttributeOrFail(id);

    const usedByProducts = await this.db.$count(productAttributeValues, eq(productAttributeValues.attributeId, id));
    if (usedByProducts > 0) {
      throw new ConflictException('Attribute is used by one or more products. Remove it from them first.');
    }

    await this.db.delete(attributes).where(eq(attributes.id, id));

    return { ok: true };
  }

  // --------------------------------------------------------
  //  Values
  // --------------------------------------------------------

  async createValue(attributeId: number, dto: CreateAttributeValueRequestDto): Promise<AdminAttributeDto> {
    await this.findAttributeOrFail(attributeId);

    const value = dto.value.trim();
    await this.assertValueAvailable(attributeId, value);

    const sortOrder = dto.sortOrder ?? (await this.db.$count(attributeValues, eq(attributeValues.attributeId, attributeId)));

    await this.db.insert(attributeValues).values({ attributeId, value, sortOrder });

    return this.loadAttribute(attributeId);
  }

  async updateValue(valueId: number, dto: UpdateAttributeValueRequestDto): Promise<AdminAttributeDto> {
    const existing = await this.findValueOrFail(valueId);

    if (dto.value !== undefined) {
      const value = dto.value.trim();
      if (value !== existing.value) {
        await this.assertValueAvailable(existing.attributeId, value, valueId);
      }
    }

    const patch: Partial<typeof attributeValues.$inferInsert> = {};
    if (dto.value !== undefined) patch.value = dto.value.trim();
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    if (Object.keys(patch).length > 0) {
      await this.db.update(attributeValues).set(patch).where(eq(attributeValues.id, valueId));
    }

    return this.loadAttribute(existing.attributeId);
  }

  async deleteValue(valueId: number): Promise<AdminAttributeDto> {
    const existing = await this.findValueOrFail(valueId);

    const usedByProducts = await this.db.$count(productAttributeValues, eq(productAttributeValues.attributeValueId, valueId));
    if (usedByProducts > 0) {
      throw new ConflictException('Attribute value is used by one or more products. Remove it from them first.');
    }

    await this.db.delete(attributeValues).where(eq(attributeValues.id, valueId));

    return this.loadAttribute(existing.attributeId);
  }

  // --------------------------------------------------------
  //  Helpers
  // --------------------------------------------------------

  private async loadAttribute(id: number): Promise<AdminAttributeDto> {
    const row = await this.db.query.attributes.findFirst({
      where: eq(attributes.id, id),
      with: { values: { orderBy: [asc(attributeValues.sortOrder), asc(attributeValues.id)] } },
    });

    if (!row) {
      throw new NotFoundException('Attribute not found');
    }

    return this.toDto(row, row.values);
  }

  private async findAttributeOrFail(id: number): Promise<AttributeRow> {
    const attribute = await this.db.query.attributes.findFirst({ where: eq(attributes.id, id) });
    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }
    return attribute;
  }

  private async findValueOrFail(id: number): Promise<ValueRow> {
    const value = await this.db.query.attributeValues.findFirst({ where: eq(attributeValues.id, id) });
    if (!value) {
      throw new NotFoundException('Attribute value not found');
    }
    return value;
  }

  private async assertNameAvailable(name: string, excludeId?: number): Promise<void> {
    const existing = await this.db.query.attributes.findFirst({ where: eq(attributes.name, name), columns: { id: true } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('An attribute with this name already exists');
    }
  }

  private async assertValueAvailable(attributeId: number, value: string, excludeId?: number): Promise<void> {
    const rows = await this.db.query.attributeValues.findMany({ where: eq(attributeValues.attributeId, attributeId), columns: { id: true, value: true } });
    const duplicate = rows.find((row) => row.value === value && row.id !== excludeId);
    if (duplicate) {
      throw new ConflictException('This attribute already has a value with the same text');
    }
  }

  private toDto(row: AttributeRow, values: ValueRow[]): AdminAttributeDto {
    return {
      id: row.id,
      name: row.name,
      title: row.title,
      usage: row.usage,
      filterType: row.filterType,
      isMultiSelect: row.isMultiSelect,
      values: values.map((value) => ({ id: value.id, value: value.value, sortOrder: value.sortOrder })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
