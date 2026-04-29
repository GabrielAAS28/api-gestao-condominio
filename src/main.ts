import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser = require('cookie-parser');
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.use(cookieParser());

  const corsOrigins = (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api');

  // Remove query params vazios para evitar 400 em pipes opcionais (ParseInt/ParseBool/ParseEnum).
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const query = req.query ?? {};
    const shouldDrop = (value: unknown) => {
      if (value === '' || value === null || value === undefined) return true;
      if (typeof value === 'string') {
        const trimmed = value.trim().toLowerCase();
        return trimmed === '' || trimmed === 'undefined' || trimmed === 'null' || trimmed === 'nan';
      }
      return false;
    };

    Object.keys(query).forEach((key) => {
      const value = query[key];
      if (Array.isArray(value)) {
        const normalized = value.filter((item) => !shouldDrop(item));
        if (normalized.length === 0) {
          delete query[key];
        } else if (normalized.length === 1) {
          query[key] = normalized[0];
        } else {
          query[key] = normalized;
        }
        return;
      }
      if (shouldDrop(value)) {
        delete query[key];
      }
    });
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // NÃO usar enableImplicitConversion: true junto com ParseIntPipe/ParseBoolPipe,
      // pois converte undefined → NaN antes do pipe específico rodar e causa
      // "Validation failed (numeric string is expected)" em queries opcionais.
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CONDIGTAL API')
    .setDescription('API de Gestão de Condomínios (NestJS + Prisma)')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 CONDIGTAL API rodando em http://localhost:${port}/api`);
  logger.log(`📚 Docs disponíveis em http://localhost:${port}/api/docs`);
}
bootstrap();
