import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  const config = new DocumentBuilder()
   .setTitle('OCR API')
   .setDescription('The OCR API description')
   .setVersion('1.0')
   .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('ocr/docs', app, document);

  const port = process.env.PORT || '8080';
  await app.listen(port, '0.0.0.0'); 
  
  const log = new Logger('APP_OCR');
  log.log(`APP_OCR is running on: http://:${port}`);
}
bootstrap();
