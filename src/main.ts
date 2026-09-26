import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppLogger } from './logger/logger.service';
import { setupSwagger } from './common/swagger/swagger.setup';
import { setupValidation } from './common/validation/validation.setup';

async function bootstrap() {
  // Buffer Nest's bootstrap logs until AppLogger is attached below.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService);
  const origins = config.getOrThrow<string[]>('app.origins');
  app.enableCors({
    // `*` (dev only) reflects any origin; otherwise an explicit allow-list.
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  });

  setupValidation(app);
  app.use(cookieParser());

  const logger = app.get(AppLogger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  process.on('uncaughtException', (error) => {
    logger.scope('app').fatal(error, { event: 'uncaughtException' });
  });
  process.on('unhandledRejection', (reason) => {
    logger.scope('app').error(reason instanceof Error ? reason : new Error(String(reason)), { event: 'unhandledRejection' });
  });

  const port = config.getOrThrow<number>('app.port');
  const swaggerUrl = setupSwagger(app, port);

  await app.listen(port);

  const appLog = logger.scope('app');
  appLog.info(`server is running on http://localhost:${port}/`);
  appLog.info(swaggerUrl);
  appLog.info(`log viewer is running on http://localhost:${port}/admin/logs`);
}
void bootstrap();
