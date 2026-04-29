import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as os from 'os';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  // Log the local network URLs
  const interfaces = os.networkInterfaces();
  logger.log(`Ứng dụng đang chạy tại:`);
  logger.log(`- Local: http://localhost:${port}`);
  
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          logger.log(`- Network: http://${addr.address}:${port}`);
        }
      }
    }
  }
}
bootstrap();
