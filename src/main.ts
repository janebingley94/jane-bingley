import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api');

  const dev = process.env.NODE_ENV !== 'production';
  const nextAppDir = join(process.cwd(), 'web');
  const nextEnabled =
    process.env.NEXT_ENABLED !== '0' &&
    existsSync(join(nextAppDir, 'package.json'));

  if (nextEnabled) {
    const requireFromWeb = createRequire(join(nextAppDir, 'package.json'));
    const nextModule = requireFromWeb('next');
    const next = nextModule?.default ?? nextModule;

    const nextApp = next({ dev, dir: nextAppDir });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();

    const server = app.getHttpAdapter().getInstance();

    server.all(/^(?!\/api).*/, (req: any, res: any) => handle(req, res));
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
