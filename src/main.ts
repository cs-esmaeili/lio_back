import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './common/swagger/swagger.setup';
import { setupValidation } from './common/validation/validation.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const origins = config.getOrThrow<string[]>('app.origins');
  app.enableCors({
    // `*` (dev only) reflects any origin; otherwise an explicit allow-list.
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  });

  setupValidation(app);
  app.use(cookieParser());
  const swaggerUrl = setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`server is running on http://localhost:${port}/`);
  console.log(swaggerUrl);
}
void bootstrap();
