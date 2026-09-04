import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { ClassConstructor } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { SliderDataDto, mapSliderData } from './slider.schema';
import { ProductListDataDto, mapProductListData } from './products.schema';
import { ThreeTextDataDto, mapThreeTextData } from './three-text.schema';

export interface SectionSchema {
  dataDto: ClassConstructor<object>;
  map: (data: unknown) => Record<string, unknown>;
}

export const SECTION_SCHEMAS: Record<string, SectionSchema> = {
  slider: { dataDto: SliderDataDto, map: mapSliderData },
  products: { dataDto: ProductListDataDto, map: mapProductListData },
  threeText: { dataDto: ThreeTextDataDto, map: mapThreeTextData },
};

function flattenValidationErrors(errors: ValidationError[], parent = ''): Array<{ field: string; message: string }> {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const details: Array<{ field: string; message: string }> = [];

    if (error.constraints) {
      details.push({ field, message: Object.values(error.constraints)[0] });
    }
    if (error.children?.length) {
      details.push(...flattenValidationErrors(error.children, field));
    }

    return details;
  });
}

export async function validateSectionData(type: string, data: unknown): Promise<void> {
  const schema = SECTION_SCHEMAS[type];
  if (!schema) {
    throw new BadRequestException({
      statusCode: 400,
      message: 'Bad Request',
      details: [{ field: 'type', message: `Unknown section type "${type}"` }],
    });
  }

  if (data === undefined || data === null) {
    return;
  }

  const instance = plainToInstance(schema.dataDto, data);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });

  if (errors.length) {
    throw new BadRequestException({
      statusCode: 400,
      message: 'Bad Request',
      details: flattenValidationErrors(errors),
    });
  }
}
