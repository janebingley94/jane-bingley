import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { GithubTokenService } from './github-token.service.js';

@Controller('github/tokens')
export class GithubTokenController {
  constructor(private readonly githubTokenService: GithubTokenService) {}

  @Get()
  async list() {
    return this.githubTokenService.list();
  }

  @Post()
  async create(@Body() body: { label?: unknown; token?: unknown }) {
    const label = typeof body.label === 'string' ? body.label : '';
    const token = typeof body.token === 'string' ? body.token : '';
    const created = await this.githubTokenService.create(label, token);
    return created;
  }

  @Post(':id/default')
  async setDefault(@Param('id', ParseIntPipe) id: number) {
    await this.githubTokenService.setDefault(id);
    return { ok: true };
  }

  @Delete()
  async clear() {
    await this.githubTokenService.clearAll();
    return { ok: true };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.githubTokenService.remove(id);
    return { ok: true };
  }
}
