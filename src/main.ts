import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { loggerNestOptions, setupLogger } from './logger/setup-logger';
import { setupSwagger } from './common/swagger/swagger.setup';
import { setupValidation } from './common/validation/validation.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, loggerNestOptions());

  const config = app.get(ConfigService);
  const allowedOrigins = config.getOrThrow<string[]>('app.allowedOrigins');
  app.enableCors({
    // `*` (dev only) reflects any origin; otherwise an explicit allow-list.
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
    credentials: true,
  });

  setupValidation(app);
  app.use(cookieParser());

  const logging = setupLogger(app);

  const port = config.getOrThrow<number>('app.port');
  const swaggerUrl = setupSwagger(app, port);

  await app.listen(port);

  logging.log(`server is running on http://localhost:${port}/`);
  logging.log(swaggerUrl);
  logging.log(`log viewer is running on http://localhost:${port}/admin/logs`);
}
void bootstrap();
