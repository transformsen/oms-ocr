import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json } from 'body-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);
  app.use(json({ limit: config.get<string>('WM_OMP_BODY_LIMIT') }));
  await app.listen(3000);
}
bootstrap();
