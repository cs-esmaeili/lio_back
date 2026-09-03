import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { INestApplication, ValidationError } from '@nestjs/common';

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

export function setupValidation(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          statusCode: 400,
          message: 'Bad Request',
          details: flattenValidationErrors(errors),
        }),
    }),
  );
}
