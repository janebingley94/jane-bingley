import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { UserService } from './user.service.js';
import { PostService } from './post.service.js';
import { User as UserModel } from './generated/prisma/client.js';
import { Post as PostModel } from './generated/prisma/client.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly UserService: UserService,
    private readonly postService: PostService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('post/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel | null> {
    return this.postService.post({ id: Number(id) });
  }

  @Get('users')
  async listUsers(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query('searchString') searchString?: string,
  ): Promise<UserModel[]> {
    return this.UserService.users({
      skip,
      take,
      where: searchString
        ? {
            OR: [
              { email: { contains: searchString } },
              { name: { contains: searchString } },
            ],
          }
        : undefined,
      orderBy: { id: 'asc' },
    });
  }

  @Get('feed')
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.posts({
      where: { published: true },
    });
  }

  @Get('filtered-posts/:searchString')
  async getFilteredPosts(
    @Param('searchString') searchString: string,
  ): Promise<PostModel[]> {
    return this.postService.posts({
      where: {
        OR: [
          {
            title: { contains: searchString },
          },
          {
            content: { contains: searchString },
          },
        ],
      },
    });
  }

  @Post('post')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData;
    return this.postService.createPost({
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    });
  }

  @Post('user')
  async signupUser(
    @Body() userData: { name?: string; email: string },
  ): Promise<UserModel> {
    return this.UserService.createUser(userData);
  }

  @Put('publish/:id')
  async publishPost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.updatePost({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete('post/:id')
  async deletePost(@Param('id', ParseIntPipe) id: number): Promise<PostModel> {
    return this.postService.deletePost({ id });
  }

  @Delete('user/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<UserModel> {
    return this.UserService.deleteUserAndPosts(id);
  }
}
