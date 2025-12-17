import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { encryptToken } from '../src/github-token.crypto.js';

function usage(): never {
  // Keep this simple: tokens should not be passed via browser.
  console.error(
    [
      'Usage:',
      '  yarn github-token:list',
      '  yarn github-token:add --label "work"   (reads token from stdin)',
      '  yarn github-token:default --id 1',
      '',
      'Examples:',
      '  echo "ghp_xxx" | yarn github-token:add --label "work"',
      '',
      'Required env:',
      '  DATABASE_URL',
      '  GITHUB_TOKEN_ENCRYPTION_KEY (32-byte base64)',
    ].join('\n'),
  );
  process.exit(1);
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function readStdin(): Promise<string> {
  return await new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const cmd = process.argv[2];
  if (!cmd) usage();

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    if (cmd === 'list') {
      const rows = await prisma.githubToken.findMany({
        select: {
          id: true,
          label: true,
          isDefault: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      });
      console.log(JSON.stringify(rows, null, 2));
      return;
    }

    if (cmd === 'add') {
      const label = getArg('--label')?.trim() ?? '';
      if (!label) usage();

      const rawToken = (await readStdin()).trim();
      if (!rawToken) {
        console.error('Missing token on stdin.');
        process.exit(1);
      }

      const encrypted = encryptToken(rawToken);
      const created = await prisma.githubToken.create({
        data: {
          label,
          ...encrypted,
        },
        select: { id: true },
      });

      await prisma.$transaction(async (tx) => {
        await tx.githubToken.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
        await tx.githubToken.update({
          where: { id: created.id },
          data: { isDefault: true },
        });
      });

      console.log(`Created token id=${created.id} (set as default).`);
      return;
    }

    if (cmd === 'default') {
      const rawId = getArg('--id');
      const id = rawId ? Number(rawId) : NaN;
      if (!Number.isFinite(id)) usage();

      await prisma.$transaction(async (tx) => {
        await tx.githubToken.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
        await tx.githubToken.update({
          where: { id },
          data: { isDefault: true },
        });
      });

      console.log(`Set default token id=${id}.`);
      return;
    }

    usage();
  } finally {
    await prisma.$disconnect();
  }
}

await main();

