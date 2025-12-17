import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { decryptToken, encryptToken } from './github-token.crypto.js';
import { Prisma } from './generated/prisma/client.js';

export type GithubTokenMeta = {
  id: number;
  label: string;
  isDefault: boolean;
  lastUsedAt: Date | null;
  githubUser: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class GithubTokenService {
  constructor(private readonly prisma: PrismaService) {}

  private mapPrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021') {
        throw new ServiceUnavailableException(
          'GithubToken table is missing. Run `yarn prisma migrate deploy` (or `yarn prisma migrate dev`) and restart the server.',
        );
      }
    }

    throw error as Error;
  }

  async list(): Promise<GithubTokenMeta[]> {
    try {
      return await this.prisma.githubToken.findMany({
        select: {
          id: true,
          label: true,
          isDefault: true,
          lastUsedAt: true,
          githubUser: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      });
    } catch (error) {
      this.mapPrismaError(error);
    }
  }

  async create(label: string, token: string): Promise<GithubTokenMeta> {
    const trimmedLabel = label.trim();
    const trimmedToken = token.trim();
    if (!trimmedLabel) throw new BadRequestException('label is required');
    if (!trimmedToken) throw new BadRequestException('token is required');

    let encrypted: ReturnType<typeof encryptToken>;
    try {
      encrypted = encryptToken(trimmedToken);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    let created: GithubTokenMeta;
    try {
      created = await this.prisma.githubToken.create({
        data: {
          label: trimmedLabel,
          ...encrypted,
        },
        select: {
          id: true,
          label: true,
          isDefault: true,
          lastUsedAt: true,
          githubUser: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      this.mapPrismaError(error);
    }

    await this.setDefault(created.id);
    return { ...created, isDefault: true };
  }

  async saveGithubUser(
    id: number,
    githubUser: Prisma.InputJsonValue,
  ): Promise<void> {
    try {
      await this.prisma.githubToken.update({
        where: { id },
        data: { githubUser },
      });
    } catch (error) {
      this.mapPrismaError(error);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.githubToken.delete({ where: { id } });
    } catch {
      throw new NotFoundException('token not found');
    }
  }

  async clearAll(): Promise<void> {
    try {
      await this.prisma.githubToken.deleteMany();
    } catch (error) {
      this.mapPrismaError(error);
    }
  }

  async setDefault(id: number): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.githubToken.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
        await tx.githubToken.update({
          where: { id },
          data: { isDefault: true },
        });
      });
    } catch (error) {
      this.mapPrismaError(error);
    }
  }

  async getDecryptedTokenById(id: number): Promise<string> {
    let row: {
      id: number;
      tokenCiphertext: string;
      tokenIv: string;
      tokenTag: string;
    } | null;
    try {
      row = await this.prisma.githubToken.findUnique({
        where: { id },
        select: {
          id: true,
          tokenCiphertext: true,
          tokenIv: true,
          tokenTag: true,
        },
      });
    } catch (error) {
      this.mapPrismaError(error);
    }
    if (!row) throw new NotFoundException('token not found');

    try {
      return decryptToken({
        tokenCiphertext: row.tokenCiphertext,
        tokenIv: row.tokenIv,
        tokenTag: row.tokenTag,
      });
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async markUsed(id: number): Promise<void> {
    try {
      await this.prisma.githubToken.update({
        where: { id },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      this.mapPrismaError(error);
    }
  }
}
