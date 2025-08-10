import fmp from '@fastify/multipart';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger, ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import validationOptions from './common/utils/validation-options';
import { ErrorResponseInterceptor } from './common/interceptors/error-response.interceptor';
import { RpcCustomExceptionFilter } from './common/filters/rpc-exception.filter';
import { envs } from './config/schema/app.schema';

async function bootstrap() {
  const logger = new Logger('MAFCS MS Gateway');

  const fastifyAdapter = new FastifyAdapter({
    logger: false,
  });

  fastifyAdapter.register(fmp, {
    limits: {
      fieldNameSize: 1000,
      fieldSize: 1300,
      fields: 10,
      fileSize: 5 * 1024 * 1024,
      files: 13,
      headerPairs: 200,
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, {
    logger: false,
  });

  const corsOptions: CorsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Active-Role'],
    credentials: true,
  };

  app.enableCors(corsOptions);

  app.useGlobalInterceptors(new ErrorResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalFilters(new RpcCustomExceptionFilter());

  await app.listen(envs.PORT, '0.0.0.0');
  logger.log('Application is running on: ' + (await app.getUrl()));
}
bootstrap();
