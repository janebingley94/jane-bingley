import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma.service.js';
import { UserService } from './user.service.js';
import { PostService } from './post.service.js';
import { GithubController } from './github.controller.js';
import { GithubService } from './github.service.js';
import { GithubTokenController } from './github-token.controller.js';
import { GithubTokenService } from './github-token.service.js';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, GithubController, GithubTokenController],
  providers: [
    AppService,
    PrismaService,
    UserService,
    PostService,
    GithubService,
    GithubTokenService,
  ],
})
export class AppModule {}
