import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, exists, ilike, inArray, sql, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import {
  AttributeUsage,
  attributeValues,
  categories,
  categoryAttributes,
  files,
  productAttributeValues,
  productCategories,
  productImages,
  productVariants,
  products,
  variantAttributeValues,
} from 'src/database/schema';
import { FileUrlService } from 'src/common/services/file-url.service';
import { AdminAvailableAttributeDto } from '../dtos/adminProduct/admin-available-attribute.dto';
import { AdminProductDto } from '../dtos/adminProduct/admin-product.dto';
import type { CreateProductRequestDto } from '../dtos/adminProduct/create-product-request.dto';
import type { DeleteProductResponseDto } from '../dtos/adminProduct/delete-product-response.dto';
import type { GetAdminProductResponseDto } from '../dtos/adminProduct/get-admin-product-response.dto';
import type { ListAdminProductsRequestDto } from '../dtos/adminProduct/list-admin-products-request.dto';
import type { ListAdminProductsResponseDto } from '../dtos/adminProduct/list-admin-products-response.dto';
import type { UpdateProductRequestDto } from '../dtos/adminProduct/update-product-request.dto';

type ProductRow = NonNullable<Awaited<ReturnType<ProductAdminService['loadProductRow']>>>;

type NormalizedVariant = {
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  position: number;
  isDefault: boolean;
  values: Map<number, number>;
};

/**
 * Admin CRUD for products and their variants (`/admin/products`).
 *
 * A product's usable attributes come from its categories (`category_attributes`).
 * SPEC attributes become the product's specifications; VARIANT attributes are the
 * axes whose combinations each carry their own SKU, price and stock. Saving a
 * product replaces its images, attribute values and variants in one transaction,
 * so a failed save never leaves a half-built product behind.
 */
@Injectable()
export class ProductAdminService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly fileUrl: FileUrlService,
  ) {}

  async listProducts(query: ListAdminProductsRequestDto): Promise<ListAdminProductsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const filters: SQL[] = [];
    if (query.search?.trim()) {
      filters.push(ilike(products.name, `%${query.search.trim()}%`));
    }
    if (query.categoryId !== undefined) {
      filters.push(
        exists(
          this.db
            .select({ value: sql`1` })
            .from(productCategories)
            .where(and(eq(productCategories.productId, products.id), eq(productCategories.categoryId, query.categoryId))),
        ),
      );
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [total, rows] = await Promise.all([
      this.db.$count(products, where),
      this.db.query.products.findMany({
        where,
        orderBy: [desc(products.id)],
        limit,
        offset,
        columns: { id: true, name: true, slug: true, updatedAt: true },
        with: {
          images: {
            columns: { id: true, fileId: true, isPrimary: true, isThumbnail: true, sortOrder: true },
            with: { file: { columns: { path: true } } },
            orderBy: [asc(productImages.sortOrder), asc(productImages.id)],
          },
          categories: { with: { category: { columns: { id: true, name: true } } } },
          variants: {
            columns: { price: true, compareAtPrice: true, stock: true, isDefault: true },
            orderBy: [desc(productVariants.isDefault), asc(productVariants.position), asc(productVariants.id)],
          },
        },
      }),
    ]);

    return {
      items: rows.map((row) => {
        const primaryImage = row.images.find((image) => image.isPrimary) ?? row.images.find((image) => image.isThumbnail) ?? row.images[0] ?? null;
        const prices = row.variants.map((variant) => Number(variant.price));

        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          primaryImageUrl: this.fileUrl.toUrl(primaryImage?.file?.path ?? null),
          categories: row.categories.map((link) => ({ id: link.category.id, name: link.category.name })),
          variantCount: row.variants.length,
          priceFrom: prices.length > 0 ? Math.min(...prices) : null,
          priceTo: prices.length > 0 ? Math.max(...prices) : null,
          totalStock: row.variants.reduce((sum, variant) => sum + variant.stock, 0),
          updatedAt: row.updatedAt.toISOString(),
        };
      }),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getProduct(id: number): Promise<GetAdminProductResponseDto> {
    const row = await this.loadProductRow(id);
    if (!row) {
      throw new NotFoundException('Product not found');
    }

    const availableAttributes = await this.getAvailableAttributes(row.categories.map((link) => link.categoryId));

    return { product: this.toAdminProduct(row), availableAttributes };
  }

  async getAvailableAttributes(categoryIds: number[]): Promise<AdminAvailableAttributeDto[]> {
    const uniqueCategoryIds = Array.from(new Set(categoryIds));
    if (uniqueCategoryIds.length === 0) {
      return [];
    }

    const rows = await this.db.query.categoryAttributes.findMany({
      where: inArray(categoryAttributes.categoryId, uniqueCategoryIds),
      orderBy: [asc(categoryAttributes.sortOrder), asc(categoryAttributes.attributeId)],
      with: { attribute: { with: { values: { orderBy: [asc(attributeValues.sortOrder), asc(attributeValues.id)] } } } },
    });

    const byAttributeId = new Map<number, AdminAvailableAttributeDto>();
    for (const row of rows) {
      const existing = byAttributeId.get(row.attributeId);
      if (existing) {
        existing.isRequired = existing.isRequired || row.isRequired;
        existing.isFilterable = existing.isFilterable || row.isFilterable;
        existing.sortOrder = Math.min(existing.sortOrder, row.sortOrder);
        continue;
      }

      byAttributeId.set(row.attributeId, {
        id: row.attribute.id,
        name: row.attribute.name,
        title: row.attribute.title,
        usage: row.attribute.usage,
        filterType: row.attribute.filterType,
        isMultiSelect: row.attribute.isMultiSelect,
        isRequired: row.isRequired,
        isFilterable: row.isFilterable,
        sortOrder: row.sortOrder,
        values: row.attribute.values.map((value) => ({ id: value.id, value: value.value, sortOrder: value.sortOrder })),
      });
    }

    return Array.from(byAttributeId.values()).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }

  async createProduct(dto: CreateProductRequestDto): Promise<AdminProductDto> {
    return this.saveProduct(null, dto);
  }

  async updateProduct(id: number, dto: UpdateProductRequestDto): Promise<AdminProductDto> {
    const existing = await this.getProduct(id);
    const input = this.mergeInput(existing.product, dto);
    return this.saveProduct(id, input);
  }

  async deleteProduct(id: number): Promise<DeleteProductResponseDto> {
    const existing = await this.db.query.products.findFirst({ where: eq(products.id, id), columns: { id: true } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.db.delete(products).where(eq(products.id, id));

    return { ok: true };
  }

  // --------------------------------------------------------
  //  Save
  // --------------------------------------------------------

  private async saveProduct(productId: number | null, input: CreateProductRequestDto): Promise<AdminProductDto> {
    const slug = input.slug;
    const name = input.name.trim();
    await this.assertSlugAvailable(slug, productId);

    const categoryIds = Array.from(new Set(input.categoryIds));
    const categoryRows = await this.db.query.categories.findMany({ where: inArray(categories.id, categoryIds), columns: { id: true } });
    if (categoryRows.length !== categoryIds.length) {
      throw new BadRequestException('One or more categories were not found');
    }

    const fileIds = Array.from(new Set(input.images.map((image) => image.fileId)));
    if (fileIds.length > 0) {
      const fileRows = await this.db.query.files.findMany({ where: inArray(files.id, fileIds), columns: { id: true } });
      if (fileRows.length !== fileIds.length) {
        throw new BadRequestException('One or more image files were not found');
      }
    }

    const availableAttributes = await this.getAvailableAttributes(categoryIds);
    const availableById = new Map(availableAttributes.map((attribute) => [attribute.id, attribute]));

    const specValues = this.validateSpecValues(input.specValues, availableById);
    const axisValues = this.validateVariantAxes(input.variantAxes, availableById);
    const variants = await this.normalizeVariants(input.variants, axisValues, slug, productId);

    // Every spec value and every axis value becomes one product attribute value row.
    const productAttributeValueKeys = new Set<string>();
    const productAttributeValueInputs: Array<{ attributeId: number; attributeValueId: number }> = [];
    const addProductAttributeValue = (attributeId: number, attributeValueId: number) => {
      const key = `${attributeId}:${attributeValueId}`;
      if (productAttributeValueKeys.has(key)) return;
      productAttributeValueKeys.add(key);
      productAttributeValueInputs.push({ attributeId, attributeValueId });
    };
    for (const value of specValues) addProductAttributeValue(value.attributeId, value.attributeValueId);
    for (const [attributeId, valueIds] of axisValues) {
      for (const valueId of valueIds) addProductAttributeValue(attributeId, valueId);
    }

    let savedId: number | null = productId;

    await this.db.transaction(async (tx) => {
      let id: number;
      if (productId === null) {
        const [created] = await tx
          .insert(products)
          .values({ name, slug, description: input.description ?? null })
          .returning({ id: products.id });
        id = created.id;
      } else {
        id = productId;
        await tx
          .update(products)
          .set({ name, slug, description: input.description ?? null })
          .where(eq(products.id, id));
      }
      savedId = id;

      await tx.delete(productCategories).where(eq(productCategories.productId, id));
      if (categoryIds.length > 0) {
        await tx.insert(productCategories).values(categoryIds.map((categoryId) => ({ productId: id, categoryId })));
      }

      await tx.delete(productImages).where(eq(productImages.productId, id));
      if (input.images.length > 0) {
        await tx.insert(productImages).values(
          input.images.map((image, index) => ({
            productId: id,
            fileId: image.fileId,
            isPrimary: image.isPrimary ?? index === 0,
            isThumbnail: image.isThumbnail ?? false,
            sortOrder: image.sortOrder ?? index,
          })),
        );
      }

      // Variants first (their links cascade), then the product attribute values.
      await tx.delete(productVariants).where(eq(productVariants.productId, id));
      await tx.delete(productAttributeValues).where(eq(productAttributeValues.productId, id));

      let insertedAttributeValues: Array<{ id: number; attributeId: number; attributeValueId: number }> = [];
      if (productAttributeValueInputs.length > 0) {
        insertedAttributeValues = await tx
          .insert(productAttributeValues)
          .values(productAttributeValueInputs.map((value) => ({ productId: id, attributeId: value.attributeId, attributeValueId: value.attributeValueId })))
          .returning({ id: productAttributeValues.id, attributeId: productAttributeValues.attributeId, attributeValueId: productAttributeValues.attributeValueId });
      }
      const attributeValueIdByKey = new Map(insertedAttributeValues.map((row) => [`${row.attributeId}:${row.attributeValueId}`, row.id]));

      const insertedVariants = await tx
        .insert(productVariants)
        .values(
          variants.map((variant) => ({
            productId: id,
            sku: variant.sku,
            price: String(variant.price),
            compareAtPrice: variant.compareAtPrice === null ? null : String(variant.compareAtPrice),
            stock: variant.stock,
            position: variant.position,
            isDefault: variant.isDefault,
          })),
        )
        .returning({ id: productVariants.id, sku: productVariants.sku });
      const variantIdBySku = new Map(insertedVariants.map((row) => [row.sku, row.id]));

      const linkRows: Array<{ variantId: number; productAttributeValueId: number }> = [];
      // Every variant is linked to the product's spec values too, so spec
      // attribute filters match on a single variant (same model as the seed).
      const specProductAttributeValueIds = specValues.map((value) => {
        const productAttributeValueId = attributeValueIdByKey.get(`${value.attributeId}:${value.attributeValueId}`);
        if (productAttributeValueId === undefined) {
          throw new BadRequestException('Unable to map a spec value');
        }
        return productAttributeValueId;
      });

      for (const variant of variants) {
        const variantId = variantIdBySku.get(variant.sku);
        if (variantId === undefined) {
          throw new BadRequestException('Unable to map a saved variant');
        }
        for (const productAttributeValueId of specProductAttributeValueIds) {
          linkRows.push({ variantId, productAttributeValueId });
        }
        for (const [attributeId, attributeValueId] of variant.values) {
          const productAttributeValueId = attributeValueIdByKey.get(`${attributeId}:${attributeValueId}`);
          if (productAttributeValueId === undefined) {
            throw new BadRequestException('Unable to map a variant value');
          }
          linkRows.push({ variantId, productAttributeValueId });
        }
      }
      if (linkRows.length > 0) {
        await tx.insert(variantAttributeValues).values(linkRows);
      }
    });

    if (savedId === null) {
      throw new BadRequestException('Unable to determine the saved product id');
    }

    return (await this.getProduct(savedId)).product;
  }

  private validateSpecValues(
    values: CreateProductRequestDto['specValues'],
    availableById: Map<number, AdminAvailableAttributeDto>,
  ): Array<{ attributeId: number; attributeValueId: number }> {
    const seen = new Set<string>();
    for (const value of values) {
      const attribute = availableById.get(value.attributeId);
      if (!attribute || attribute.usage !== AttributeUsage.SPEC) {
        throw new BadRequestException(`Attribute ${value.attributeId} is not a spec attribute of the selected categories`);
      }
      if (!attribute.values.some((option) => option.id === value.attributeValueId)) {
        throw new BadRequestException(`Value ${value.attributeValueId} does not belong to attribute ${value.attributeId}`);
      }
      const key = `${value.attributeId}:${value.attributeValueId}`;
      if (seen.has(key)) {
        throw new BadRequestException('Duplicate spec value');
      }
      seen.add(key);
    }
    return values.map((value) => ({ attributeId: value.attributeId, attributeValueId: value.attributeValueId }));
  }

  /** Validates the variant axes and returns attributeId -> set of selected value ids. */
  private validateVariantAxes(axes: CreateProductRequestDto['variantAxes'], availableById: Map<number, AdminAvailableAttributeDto>): Map<number, number[]> {
    const axisValues = new Map<number, number[]>();
    for (const axis of axes) {
      const attribute = availableById.get(axis.attributeId);
      if (!attribute || attribute.usage !== AttributeUsage.VARIANT) {
        throw new BadRequestException(`Attribute ${axis.attributeId} is not a variant attribute of the selected categories`);
      }
      if (axisValues.has(axis.attributeId)) {
        throw new BadRequestException('Duplicate variant axis');
      }
      const ids = Array.from(new Set(axis.valueIds));
      for (const valueId of ids) {
        if (!attribute.values.some((option) => option.id === valueId)) {
          throw new BadRequestException(`Value ${valueId} does not belong to attribute ${axis.attributeId}`);
        }
      }
      axisValues.set(axis.attributeId, ids);
    }
    return axisValues;
  }

  private async normalizeVariants(
    variants: CreateProductRequestDto['variants'],
    axisValues: Map<number, number[]>,
    slug: string,
    productId: number | null,
  ): Promise<NormalizedVariant[]> {
    const combinations = new Set<string>();
    const skus = new Set<string>();

    const normalized = variants.map((variant, index) => {
      const valueMap = new Map<number, number>();
      for (const value of variant.values) {
        const allowed = axisValues.get(value.attributeId);
        if (!allowed || !allowed.includes(value.attributeValueId)) {
          throw new BadRequestException(`Variant value ${value.attributeValueId} does not belong to axis ${value.attributeId}`);
        }
        if (valueMap.has(value.attributeId)) {
          throw new BadRequestException('A variant cannot select two values of the same axis');
        }
        valueMap.set(value.attributeId, value.attributeValueId);
      }
      if (valueMap.size !== axisValues.size) {
        throw new BadRequestException('Each variant must select exactly one value per axis');
      }

      const combinationKey = Array.from(valueMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([attributeId, valueId]) => `${attributeId}:${valueId}`)
        .join('|');
      if (combinations.has(combinationKey)) {
        throw new BadRequestException('Duplicate variant combination');
      }
      combinations.add(combinationKey);

      const sku = (variant.sku ?? '').trim() || `${slug}-${index + 1}`;
      if (skus.has(sku)) {
        throw new BadRequestException(`Duplicate SKU: ${sku}`);
      }
      skus.add(sku);

      return {
        sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice ?? null,
        stock: variant.stock,
        position: index,
        isDefault: variant.isDefault ?? index === 0,
        values: valueMap,
      };
    });

    // Exactly one default variant.
    const defaults = normalized.filter((variant) => variant.isDefault);
    if (defaults.length === 0) {
      normalized[0].isDefault = true;
    } else {
      for (const variant of defaults.slice(1)) {
        variant.isDefault = false;
      }
    }

    const existingSkus = await this.db.query.productVariants.findMany({
      where: inArray(productVariants.sku, Array.from(skus)),
      columns: { sku: true, productId: true },
    });
    for (const row of existingSkus) {
      if (productId === null || row.productId !== productId) {
        throw new ConflictException(`SKU already in use: ${row.sku}`);
      }
    }

    return normalized;
  }

  // --------------------------------------------------------
  //  Loading / mapping
  // --------------------------------------------------------

  private loadProductRow(id: number) {
    return this.db.query.products.findFirst({
      where: eq(products.id, id),
      columns: { id: true, name: true, slug: true, description: true, createdAt: true, updatedAt: true },
      with: {
        images: {
          columns: { id: true, fileId: true, isPrimary: true, isThumbnail: true, sortOrder: true },
          with: { file: { columns: { path: true } } },
          orderBy: [asc(productImages.sortOrder), asc(productImages.id)],
        },
        categories: { with: { category: { columns: { id: true, name: true, slug: true } } } },
        attributeValues: {
          columns: { id: true, attributeId: true, attributeValueId: true },
          with: {
            attribute: { columns: { id: true, usage: true } },
          },
        },
        variants: {
          columns: { id: true, sku: true, price: true, compareAtPrice: true, stock: true, isDefault: true, position: true },
          orderBy: [desc(productVariants.isDefault), asc(productVariants.position), asc(productVariants.id)],
          with: { variantAttributeValues: { columns: { productAttributeValueId: true } } },
        },
      },
    });
  }

  private toAdminProduct(row: ProductRow): AdminProductDto {
    const productAttributeValueInfo = new Map<number, { attributeId: number; attributeValueId: number; usage: AttributeUsage }>();
    for (const value of row.attributeValues) {
      productAttributeValueInfo.set(value.id, {
        attributeId: value.attributeId,
        attributeValueId: value.attributeValueId,
        usage: value.attribute.usage,
      });
    }

    const specValues = row.attributeValues
      .filter((value) => value.attribute.usage === AttributeUsage.SPEC)
      .map((value) => ({ attributeId: value.attributeId, attributeValueId: value.attributeValueId }));

    const axisValueIds = new Map<number, number[]>();
    for (const value of row.attributeValues) {
      if (value.attribute.usage !== AttributeUsage.VARIANT) continue;
      const list = axisValueIds.get(value.attributeId) ?? [];
      list.push(value.attributeValueId);
      axisValueIds.set(value.attributeId, list);
    }
    const variantAxes = Array.from(axisValueIds, ([attributeId, valueIds]) => ({ attributeId, valueIds })).sort((a, b) => a.attributeId - b.attributeId);

    const variants = row.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: Number(variant.price),
      compareAtPrice: variant.compareAtPrice === null ? null : Number(variant.compareAtPrice),
      stock: variant.stock,
      isDefault: variant.isDefault,
      values: variant.variantAttributeValues
        .map((link) => productAttributeValueInfo.get(link.productAttributeValueId))
        .filter((info): info is { attributeId: number; attributeValueId: number; usage: AttributeUsage } => info !== undefined && info.usage === AttributeUsage.VARIANT)
        .map((info) => ({ attributeId: info.attributeId, attributeValueId: info.attributeValueId }))
        .sort((a, b) => a.attributeId - b.attributeId),
    }));

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      categories: row.categories.map((link) => ({ id: link.category.id, name: link.category.name, slug: link.category.slug })),
      images: row.images.map((image) => ({
        id: image.id,
        fileId: image.fileId,
        url: this.fileUrl.toUrl(image.file?.path ?? null),
        isPrimary: image.isPrimary,
        isThumbnail: image.isThumbnail,
        sortOrder: image.sortOrder,
      })),
      specValues,
      variantAxes,
      variants,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /** Rebuilds the editor input from a stored product, applying the partial update on top. */
  private mergeInput(existing: AdminProductDto, dto: UpdateProductRequestDto): CreateProductRequestDto {
    return {
      name: dto.name ?? existing.name,
      slug: dto.slug ?? existing.slug,
      description: dto.description !== undefined ? dto.description : existing.description,
      categoryIds: dto.categoryIds ?? existing.categories.map((category) => category.id),
      images:
        dto.images ??
        existing.images.map((image) => ({
          fileId: image.fileId,
          isPrimary: image.isPrimary,
          isThumbnail: image.isThumbnail,
          sortOrder: image.sortOrder,
        })),
      specValues: dto.specValues ?? existing.specValues,
      variantAxes: dto.variantAxes ?? existing.variantAxes,
      variants:
        dto.variants ??
        existing.variants.map((variant) => ({
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          stock: variant.stock,
          isDefault: variant.isDefault,
          values: variant.values,
        })),
    };
  }

  private async assertSlugAvailable(slug: string, excludeId: number | null): Promise<void> {
    const existing = await this.db.query.products.findFirst({ where: eq(products.slug, slug), columns: { id: true } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('A product with this slug already exists');
    }
  }
}
