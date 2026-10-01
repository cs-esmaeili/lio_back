import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject, OperationObject, ReferenceObject, SchemaObject } from '@nestjs/swagger';
import { STATUS_CODES } from 'node:http';
import { PHONE_NUMBER_EXAMPLE } from '../../config/configuration';

const SWAGGER_URL = 'docs';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

function successEnvelope(status: number, data: SchemaObject | ReferenceObject): SchemaObject {
  return {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: status },
      data,
      message: { type: 'string', example: STATUS_CODES[status] ?? 'OK' },
    },
    required: ['statusCode', 'data', 'message'],
  };
}

function errorEnvelope(status: number): SchemaObject {
  return {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: status },
      message: { type: 'string', example: STATUS_CODES[status] ?? 'Internal Server Error' },
      details: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    required: ['statusCode', 'message'],
  };
}

function wrapSwaggerEnvelope(document: OpenAPIObject): void {
  for (const pathItem of Object.values(document.paths)) {
    for (const method of HTTP_METHODS) {
      const operation: OperationObject | undefined = pathItem[method];
      if (!operation) continue;

      for (const [status, response] of Object.entries(operation.responses)) {
        if (!response || '$ref' in response) continue;
        const code = Number(status);
        if (!Number.isInteger(code)) continue;

        // Redirects carry no JSON body; their contract is the Location header.
        if (code >= 300 && code < 400) continue;

        if (code >= 200 && code < 300) {
          const media = response.content?.['application/json'];
          if (!media?.schema) continue;
          media.schema = successEnvelope(code, media.schema);
        } else {
          response.content = { 'application/json': { schema: errorEnvelope(code) } };
        }
      }
    }
  }
}

/** Recursively replace every string equal to `from`, in place. */
function replaceStringValue(node: unknown, from: string, to: string): void {
  if (Array.isArray(node)) {
    for (const item of node) replaceStringValue(item, from, to);
    return;
  }
  if (!node || typeof node !== 'object') return;

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (typeof value === 'string') {
      if (value === from) (node as Record<string, unknown>)[key] = to;
    } else {
      replaceStringValue(value, from, to);
    }
  }
}

/**
 * Swaps the DTO example placeholder for the configured `SEED_ADMIN_PHONE`.
 *
 * DTO decorators are evaluated before `ConfigModule` loads `.env`, so they all
 * carry the `PHONE_NUMBER_EXAMPLE` default. Here the env is loaded and the
 * document can be built with the real value.
 */
function applyConfiguredPhoneExample(app: INestApplication, document: OpenAPIObject): void {
  const phone = app.get(ConfigService).get<string>('seed.adminPhone')?.trim();
  if (!phone || phone === PHONE_NUMBER_EXAMPLE) return;

  replaceStringValue(document, PHONE_NUMBER_EXAMPLE, phone);
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const swaggerConfig = new DocumentBuilder().setTitle('Lio API').setDescription('Authentication and session management API').setVersion('1.0').addCookieAuth('session').build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  wrapSwaggerEnvelope(document);
  applyConfiguredPhoneExample(app, document);
  return document;
}

export function setupSwagger(app: INestApplication, port: number): string {
  const document = createOpenApiDocument(app);
  SwaggerModule.setup(SWAGGER_URL, app, document);

  return `swagger is running on http://localhost:${port}/${SWAGGER_URL}/`;
}
