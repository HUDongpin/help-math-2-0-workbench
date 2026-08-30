import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {describe, it} from 'node:test';

const fakeTransportVariables = [
  'NOVA_TEST_FAKE_TRANSPORT_AUTHORIZATION',
  'NOVA_TEST_FAKE_TRANSPORT_MODE',
  'NOVA_TEST_FAKE_TRANSPORT_ORIGIN',
  'NOVA_TEST_FAKE_TRANSPORT_RECEIPT_PATH',
] as const;

function importProductionConfig(
  variables: Partial<Record<(typeof fakeTransportVariables)[number], string>>,
) {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
  };
  for (const variable of fakeTransportVariables) {
    delete environment[variable];
  }
  Object.assign(environment, variables);
  return spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '--input-type=module',
      '--eval',
      "await import('./next.config.ts')",
    ],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
      env: environment,
    },
  );
}

describe('Nova fake transport production build guard', () => {
  it('keeps governed real-route suites out of ordinary Playwright discovery', () => {
    const configSource = readFileSync(
      new URL('../playwright.config.ts', import.meta.url),
      'utf8',
    );
    assert.match(
      configSource,
      /testIgnore:\s*\[[\s\S]*?'nova-capability-gates\.spec\.ts'[\s\S]*?'nova-full-stack\.spec\.ts'[\s\S]*?'nova-provider-failure\.spec\.ts'[\s\S]*?'nova-speech-negative\.spec\.ts'/u,
    );
  });

  it('keeps the modern-wide local worker count aligned with CI', () => {
    const packageDocument = JSON.parse(readFileSync(
      new URL('../package.json', import.meta.url),
      'utf8',
    )) as {scripts?: Record<string, string>};
    const configSource = readFileSync(
      new URL('../playwright.config.ts', import.meta.url),
      'utf8',
    );
    assert.match(
      packageDocument.scripts?.['test:e2e:modern-wide'] ?? '',
      /(?:^|\s)--workers=2(?:\s|$)/u,
    );
    assert.match(
      configSource,
      /workers:\s*process\.env\.CI\s*\?\s*2\s*:\s*undefined/u,
    );
  });

  it('keeps Playwright commit metadata without buffering the candidate git diff', () => {
    const configSource = readFileSync(
      new URL('../playwright.config.ts', import.meta.url),
      'utf8',
    );
    assert.match(
      configSource,
      /captureGitInfo:\s*\{\s*commit:\s*true,\s*diff:\s*false,\s*\}/u,
    );
  });

  for (const variable of fakeTransportVariables) {
    it(`rejects production when ${variable} is defined as an empty string`, () => {
      const result = importProductionConfig({[variable]: ''});
      assert.notEqual(result.status, 0);
      assert.match(
        `${result.stdout}\n${result.stderr}`,
        /Nova full-stack fake transport is forbidden in production builds/u,
      );
    });
  }

  it('rejects a non-empty fake transport authorization before Next can build', () => {
    const result = importProductionConfig({
      NOVA_TEST_FAKE_TRANSPORT_AUTHORIZATION:
        'full-stack-fake-upstream-v1',
    });
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /Nova full-stack fake transport is forbidden in production builds/u,
    );
  });

  it('does not trigger the fake transport guard when all four variables are absent', () => {
    const result = importProductionConfig({});
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  });
});
