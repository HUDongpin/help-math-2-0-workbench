import {spawnSync} from 'node:child_process';
import path from 'node:path';

const playwrightCli = path.resolve(
  process.cwd(),
  '../../node_modules/@playwright/test/cli.js',
);
const scenarios = [
  'all-on',
  'master-off',
  'provider-invalid',
  'release-empty',
  'rollout-invalid',
  'modern-off',
  'course-off',
  'media-off',
] as const;

for (const [index, scenario] of scenarios.entries()) {
  const port = 3214 + index;
  process.stdout.write(
    `\n[FULL_STACK_FAKE_UPSTREAM] ${scenario} on 127.0.0.1:${port}\n`,
  );
  const result = spawnSync(
    process.execPath,
    [
      playwrightCli,
      'test',
      '--config',
      'playwright.nova-full-stack.config.ts',
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NOVA_FULL_STACK_SCENARIO: scenario,
        PLAYWRIGHT_PORT: String(port),
        PLAYWRIGHT_REUSE_EXISTING_SERVER: '0',
      },
      stdio: 'inherit',
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
