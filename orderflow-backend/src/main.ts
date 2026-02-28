import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { setupSwagger } from './config/swagger';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  app.enableCors();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  await app.listen(process.env.API_PORT || 3000, '0.0.0.0');

  console.log(
    `Swagger documentation available at: ${await app.getUrl()}/api/docs`,
  );
  console.log(`Application is running on: ${await app.getUrl()}/api`);
}

void bootstrap();
