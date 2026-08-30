import assert from 'node:assert/strict';
import type {ChildProcess} from 'node:child_process';
import {EventEmitter} from 'node:events';
import test from 'node:test';

import {
  buildDeploymentSafeTestInvocation,
  buildDeploymentSafeTestPlan,
  DEPLOYMENT_SAFE_TEST_SKIP_NAMES,
  DEPLOYMENT_SAFE_TEST_SKIP_PATTERN,
  escapeRegExp,
  exitCodeFromChildStatus,
  EXCLUDED_TEST_PATHS,
  REQUIRED_DEPLOYMENT_TEST_PATHS,
  runDeploymentSafeTests,
} from '../scripts/run-deployment-safe-tests.mjs';

const allTestPaths = [
  ...EXCLUDED_TEST_PATHS,
  ...REQUIRED_DEPLOYMENT_TEST_PATHS,
  'tests/future-deployment-test.test.ts',
].sort();

test('deployment-safe plan has one exact file exclusion, seven exact test skips, and three required asset tests', () => {
  assert.deepEqual(EXCLUDED_TEST_PATHS, [
    'tests/g4-l3-lesson-navigation.test.ts',
  ]);
  assert.deepEqual(DEPLOYMENT_SAFE_TEST_SKIP_NAMES, [
    'candidate profile holds 3 alternate runtime files and 204 frozen evidence files',
    'showcase asset policy binds exactly the 39 page packages and one shell',
    'source-bound resume prompt stays local, explicit, and acceptance-neutral',
    'source-bound Exit prompt preserves the shell visual and replaces legacy network behavior locally',
    'all 54 runtime files are exact-byte and exact-SHA bound to their manifests',
    'G5 L4 shell Key Terms candidate stays exact-source-bound and acceptance-neutral',
    'G4 L3 and G5 L4 formal adapters exclude both legacy shells',
  ]);
  assert.deepEqual(REQUIRED_DEPLOYMENT_TEST_PATHS, [
    'tests/private-preview-deployment-assets.test.ts',
    'tests/current-js-showcase-publication.test.ts',
    'tests/page-only-current-js-showcase-asset-policy.test.ts',
  ]);

  const plan = buildDeploymentSafeTestPlan(allTestPaths);
  assert.deepEqual(plan.excludedTestPaths, EXCLUDED_TEST_PATHS);
  assert.deepEqual(
    plan.selectedTestPaths,
    allTestPaths.filter((relativePath) => !EXCLUDED_TEST_PATHS.includes(relativePath)),
  );
  assert.equal(plan.selectedTestPaths.includes('tests/future-deployment-test.test.ts'), true);
  assert.deepEqual(plan.requiredTestPaths, REQUIRED_DEPLOYMENT_TEST_PATHS);
  assert.equal(plan.testSkipNames.length, 7);
});

test('deployment-safe plan rejects an extra file filter and any missing required asset test', () => {
  assert.throws(
    () => buildDeploymentSafeTestPlan(allTestPaths, {
      fileExclusions: [...EXCLUDED_TEST_PATHS, 'tests/extra-filter.test.ts'],
    }),
    /exact approved list/u,
  );
  assert.throws(
    () => buildDeploymentSafeTestPlan(
      allTestPaths.filter((relativePath) => relativePath !== REQUIRED_DEPLOYMENT_TEST_PATHS[0]),
    ),
    /omitted required deployment test/u,
  );
});

test('skip pattern is regex-escaped and anchored to the seven exact names', () => {
  assert.equal(escapeRegExp('literal + [name] (v1)'), 'literal \\+ \\[name\\] \\(v1\\)');
  const pattern = new RegExp(DEPLOYMENT_SAFE_TEST_SKIP_PATTERN, 'u');
  assert.equal(pattern.test(DEPLOYMENT_SAFE_TEST_SKIP_NAMES[0]), true);
  assert.equal(pattern.test(`${DEPLOYMENT_SAFE_TEST_SKIP_NAMES[0]} extra`), false);
  assert.equal(pattern.test(`prefix ${DEPLOYMENT_SAFE_TEST_SKIP_NAMES[0]}`), false);
});

test('invocation uses the repository Node executable, exact skip flag, web cwd, and shell false', () => {
  const environment = {
    DEPLOYMENT_SAFE_SENTINEL: '1',
    NODE_ENV: 'test',
  } as NodeJS.ProcessEnv;
  const invocation = buildDeploymentSafeTestInvocation(
    ['tests/example.test.ts'],
    {cwd: '/tmp/helpmath-deployment-safe', env: environment},
  );
  assert.equal(invocation.command, process.execPath);
  assert.deepEqual(invocation.args, [
    '--import',
    'tsx',
    '--test',
    '--test-skip-pattern',
    DEPLOYMENT_SAFE_TEST_SKIP_PATTERN,
    'tests/example.test.ts',
  ]);
  assert.deepEqual(invocation.options, {
    cwd: '/tmp/helpmath-deployment-safe',
    env: environment,
    shell: false,
    stdio: 'inherit',
  });
});

test('child exit code and signal are propagated without changing the invocation', async () => {
  type SpawnCapture = [
    string,
    readonly string[],
    {cwd: string; env: NodeJS.ProcessEnv; shell: false; stdio: 'inherit'},
  ];
  let captured: SpawnCapture | undefined;
  let child: EventEmitter | undefined;
  const fakeSpawn = (
    command: string,
    args: readonly string[],
    options: SpawnCapture[2],
  ): ChildProcess => {
    captured = [command, args, options];
    child = new EventEmitter();
    return child as unknown as ChildProcess;
  };
  const exitPromise = runDeploymentSafeTests(['tests/example.test.ts'], {
    cwd: '/tmp/helpmath-deployment-safe',
    env: {DEPLOYMENT_SAFE_SENTINEL: '1', NODE_ENV: 'test'} as NodeJS.ProcessEnv,
    spawnImpl: fakeSpawn as unknown as typeof import('node:child_process').spawn,
  });
  child!.emit('exit', 17, null);
  const exitResult = await exitPromise;
  assert.equal(exitResult.code, 17);
  assert.equal(exitResult.signal, null);
  assert.equal(exitCodeFromChildStatus(exitResult), 17);
  assert.equal(captured![0], process.execPath);
  assert.equal(captured![2].shell, false);

  let signalChild: EventEmitter | undefined;
  const signalSpawn = (): ChildProcess => {
    signalChild = new EventEmitter();
    return signalChild as unknown as ChildProcess;
  };
  const signalPromise = runDeploymentSafeTests(['tests/example.test.ts'], {
    spawnImpl: signalSpawn as unknown as typeof import('node:child_process').spawn,
  });
  signalChild!.emit('exit', null, 'SIGTERM');
  const signalResult = await signalPromise;
  assert.deepEqual(signalResult, {code: null, signal: 'SIGTERM'});
  assert.equal(exitCodeFromChildStatus(signalResult), 143);
});
