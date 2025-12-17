import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class GithubService {
  async getMe(token: string) {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'jane-nest-app',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new HttpException(
        text || `GitHub API error (${response.status})`,
        response.status,
      );
    }

    return response.json();
  }
}

