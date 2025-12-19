import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

const yarnEnv = {
  ...process.env,
  YARN_CACHE_FOLDER: join(process.cwd(), '.yarn-cache'),
};

const webDir = join(process.cwd(), 'web');
const hasWeb = existsSync(join(webDir, 'package.json'));

if (hasWeb && process.env.NEXT_ENABLED !== '0') {
  await run(
    'yarn',
    ['install', '--non-interactive', '--network-timeout', '600000'],
    { cwd: webDir, env: yarnEnv },
  );
  await run('yarn', ['run', 'build'], { cwd: webDir, env: yarnEnv });
}

await run('yarn', ['prisma', 'generate'], { env: yarnEnv });
await run('yarn', ['run', 'build:api'], { env: yarnEnv });
