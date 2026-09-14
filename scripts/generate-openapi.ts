import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from '../src/app.module';
import { createOpenApiDocument } from '../src/common/swagger/swagger.setup';

const OUTPUT_FILE = resolve(process.cwd(), 'openapi.json');

async function generateOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });

  try {
    const document = createOpenApiDocument(app);
    writeFileSync(OUTPUT_FILE, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    console.log(`openapi.json written to ${OUTPUT_FILE}`);
  } finally {
    await app.close();
  }
}

void generateOpenApi().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
