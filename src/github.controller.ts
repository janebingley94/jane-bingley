import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { GithubService } from './github.service.js';
import { GithubTokenService } from './github-token.service.js';

@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly githubTokenService: GithubTokenService,
  ) {}

  @Post('me')
  async me(@Body() body: { tokenId?: unknown; token?: unknown } | undefined) {
    const tokenId =
      typeof body?.tokenId === 'number'
        ? body.tokenId
        : typeof body?.tokenId === 'string'
          ? Number(body.tokenId)
          : undefined;

    let token: string | undefined;
    if (typeof tokenId === 'number' && Number.isFinite(tokenId)) {
      token = await this.githubTokenService.getDecryptedTokenById(tokenId);
      await this.githubTokenService.markUsed(tokenId);
      await this.githubTokenService.setDefault(tokenId);
    } else {
      const provided =
        typeof body?.token === 'string' ? body.token.trim() : undefined;
      token = provided || process.env.GITHUB_TOKEN;
    }

    if (!token) {
      throw new BadRequestException(
        'Missing GitHub token. Provide { token } or set GITHUB_TOKEN.',
      );
    }

    const user = await this.githubService.getMe(token);
    if (typeof tokenId === 'number' && Number.isFinite(tokenId)) {
      await this.githubTokenService.saveGithubUser(tokenId, user);
    }
    return user;
  }
}
