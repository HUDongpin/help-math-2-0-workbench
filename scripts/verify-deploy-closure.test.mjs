import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REQUIRED_FAIL_CLOSED_RULES,
  classifyForbiddenDeployPath,
  ignoredByRules,
  parseIgnoreRules,
  verifyDeployClosure,
} from './verify-deploy-closure.mjs';

function indexEntry(path, mode = '100644', objectId = 'a'.repeat(40)) {
  return {mode, objectId, path};
}

test('ordered ignore rules preserve exact runtime report exceptions', () => {
  const rules = parseIgnoreRules(`
reports/*
!reports/g5-l4-source-scope-freeze.json
source-assets/
`);
  assert.equal(ignoredByRules('reports/private-review.json', rules), true);
  assert.equal(
    ignoredByRules('reports/browser-qa/private-review/screenshot.png', rules),
    true,
  );
  assert.equal(
    ignoredByRules('reports/g5-l4-source-scope-freeze.json', rules),
    false,
  );
  assert.equal(ignoredByRules('source-assets/flash/source.swf', rules), true);
});

test('dangerous paths are classified without reading or reporting values', () => {
  assert.equal(classifyForbiddenDeployPath('pkcs11.txt'), 'machine-security-config');
  assert.equal(
    classifyForbiddenDeployPath('.codex-validation-p51-e355/file.txt'),
    'linked-worktree-path',
  );
  assert.equal(
    classifyForbiddenDeployPath('source-assets/flash/course.fla'),
    'legacy-source-binary',
  );
  assert.equal(classifyForbiddenDeployPath('apps/web/app/page.tsx'), null);
});

test('every environment-file shape is excluded before a Vercel upload', () => {
  const rules = parseIgnoreRules(`${REQUIRED_FAIL_CLOSED_RULES.join('\n')}\n`);
  for (const filePath of [
    '.env',
    '.env.production',
    'apps/web/.env',
    'apps/web/.env.preview.local',
  ]) {
    assert.equal(ignoredByRules(filePath, rules), true, filePath);
  }
});

test('controller, security, and Hosted test controls remain mandatory deployment exclusions', () => {
  const rules = parseIgnoreRules(`${REQUIRED_FAIL_CLOSED_RULES.join('\n')}\n`);
  for (const filePath of [
    '.launch-control-runtime/lease.json',
    '.cache/chromium/profile.json',
    'apps/web/.cache/next/pack.gz',
    '.gitleaks.toml',
    '.gitleaksignore',
    'nested/.gitleaksignore',
    'packages/demos/hosted-tests.v1.json',
    'packages/demos/scripts/run-hosted-tests.mjs',
  ]) {
    assert.equal(ignoredByRules(filePath, rules), true, filePath);
  }
});

test('closure fails on a gitlink even when a path ignore would hide it', () => {
  const ignoreContents = `${REQUIRED_FAIL_CLOSED_RULES.join('\n')}\n`;
  const result = verifyDeployClosure({
    trackedPaths: ['.codex-validation-p51-e355', 'apps/web/app/page.tsx'],
    stagedEntries: [
      indexEntry('.codex-validation-p51-e355', '160000'),
      indexEntry('apps/web/app/page.tsx'),
    ],
    ignoreContents,
  });
  assert.equal(result.status, 'FAIL');
  assert.deepEqual(result.gitlinks, ['.codex-validation-p51-e355']);
});

test('closure rejects symlinks and every other non-regular Git index mode', () => {
  const result = verifyDeployClosure({
    trackedPaths: ['apps/web/public/outside-link'],
    stagedEntries: [indexEntry('apps/web/public/outside-link', '120000')],
    ignoreContents: `${REQUIRED_FAIL_CLOSED_RULES.join('\n')}\n`,
  });
  assert.equal(result.status, 'FAIL');
  assert.deepEqual(result.unsafeIndexEntries, [
    {mode: '120000', path: 'apps/web/public/outside-link'},
  ]);
});

test('closure passes only when required deny rules and path checks close', () => {
  const ignoreContents = `${REQUIRED_FAIL_CLOSED_RULES.join('\n')}\nreports/*\n`;
  const result = verifyDeployClosure({
    trackedPaths: [
      'apps/web/app/page.tsx',
      'pkcs11.txt',
      'reports/private-review.json',
      'source-assets/flash/course.swf',
    ],
    stagedEntries: [
      indexEntry('apps/web/app/page.tsx'),
      indexEntry('pkcs11.txt'),
      indexEntry('reports/private-review.json'),
      indexEntry('source-assets/flash/course.swf'),
    ],
    ignoreContents,
  });
  assert.equal(result.status, 'PASS');
  assert.equal(result.deployInputCount, 1);
  assert.match(result.deployInputIndexIdentitySetSha256, /^[a-f0-9]{64}$/u);
  assert.equal(result.forbiddenInputs.length, 0);
});

test('closure fails if a mandatory absent-path protection is removed', () => {
  const ignoreContents = REQUIRED_FAIL_CLOSED_RULES.filter(
    (rule) => rule !== 'pkcs11.txt',
  ).join('\n');
  const result = verifyDeployClosure({
    trackedPaths: ['apps/web/app/page.tsx'],
    stagedEntries: [indexEntry('apps/web/app/page.tsx')],
    ignoreContents,
  });
  assert.equal(result.status, 'FAIL');
  assert.deepEqual(result.missingRequiredRules, ['pkcs11.txt']);
});

test('closure fails if a mandatory controller-runtime exclusion is removed', () => {
  const ignoreContents = REQUIRED_FAIL_CLOSED_RULES.filter(
    (rule) => rule !== '/.launch-control-runtime/',
  ).join('\n');
  const result = verifyDeployClosure({
    trackedPaths: ['apps/web/app/page.tsx'],
    stagedEntries: [indexEntry('apps/web/app/page.tsx')],
    ignoreContents,
  });
  assert.equal(result.status, 'FAIL');
  assert.deepEqual(result.missingRequiredRules, ['/.launch-control-runtime/']);
});
