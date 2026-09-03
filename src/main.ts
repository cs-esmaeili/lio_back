import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './common/swagger/swagger.setup';
import { setupValidation } from './common/validation/validation.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupValidation(app);
  app.use(cookieParser());
  const swaggerUrl = setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`server is running on http://localhost:${port}/`);
  console.log(swaggerUrl);
}
void bootstrap();
