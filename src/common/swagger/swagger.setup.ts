import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject, OperationObject, ReferenceObject, SchemaObject } from '@nestjs/swagger';
import { STATUS_CODES } from 'node:http';

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

export function setupSwagger(app: INestApplication): string {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lio API')
    .setDescription('Authentication and session management API')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .addCookieAuth('refresh_token')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  wrapSwaggerEnvelope(document);
  SwaggerModule.setup(SWAGGER_URL, app, document);

  const port = process.env.PORT ?? 3000;
  return `swagger is running on http://localhost:${port}/${SWAGGER_URL}/`;
}
