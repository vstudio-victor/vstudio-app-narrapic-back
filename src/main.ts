// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  dotenv.config();
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:4201'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve contracts folder as static
  app.useStaticAssets(join(__dirname, '..', 'contracts'), {
    prefix: '/contracts',
  });

  await app.listen(3000);

  console.log('🚀 NestJS: http://localhost:3000');
  console.log('📄 OpenAPI YAML: http://localhost:3000/contracts/openapi.yaml');
}
bootstrap();
