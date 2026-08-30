import assert from 'node:assert/strict';
import type {ChildProcess} from 'node:child_process';
import {EventEmitter} from 'node:events';
import test from 'node:test';

import {
  buildDeploymentE2eInvocation,
  buildExactGrepInvertPattern,
  DEPLOYMENT_E2E_ENV,
  DEPLOYMENT_E2E_GREP_INVERT_PATTERN,
  DEPLOYMENT_E2E_PLAYWRIGHT_CLI,
  DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES,
  DEPLOYMENT_E2E_SPEC_PATHS,
  DEPLOYMENT_E2E_WEB_ROOT,
  escapeRegExp,
  exitCodeFromChildStatus,
  runDeploymentE2e,
} from '../scripts/run-deployment-e2e.mjs';

test('deployment E2E runner freezes the exact five-spec allowlist and non-deployment names', () => {
  assert.deepEqual(DEPLOYMENT_E2E_SPEC_PATHS, [
    'e2e/site.spec.ts',
    'e2e/prototype-acceptance.spec.ts',
    'e2e/modern-wide-geometry.spec.ts',
    'e2e/canvas-sharpness.spec.ts',
    'e2e/learning-experience-polish.spec.ts',
  ]);
  assert.deepEqual(DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES, [
    'Conversion 1.2 local diagnostic renders its deterministic JavaScript stage',
    'Conversion 1.4 local diagnostic renders its deterministic JavaScript stage',
    'development-only diagnostic image assets respond with PNG content',
    'prototype demos honor exact one-indexed frame capture',
    'designer tools are explicit and remain outside the ordinary learning workspace',
    'workspace tools work without turning preview controls into real records',
    'dark designer-only Design notes screen has no serious or critical axe violations',
    'every learner screen and designer-only teacher screen stays axe-clean',
    'local audit archive fails closed until strict completion ledger entries exist',
    '/migration-status?view=designer has no serious or critical axe violations',
  ]);
  assert.equal(DEPLOYMENT_E2E_ENV.CURRENT_JS_CANDIDATE_PROFILE_ENABLED, 'false');
  assert.equal(DEPLOYMENT_E2E_ENV.MODERN_WIDE_SHELL_ENABLED, 'true');
  assert.equal(DEPLOYMENT_E2E_ENV.NOVA_CLIENT_RENDER_MOCK_ENABLED, 'true');
  for (const name of [
    'CURRENT_JS_SHOWCASE_G3_L2_ENABLED',
    'CURRENT_JS_SHOWCASE_G4_L3_ENABLED',
    'CURRENT_JS_SHOWCASE_G4_L5_ENABLED',
    'CURRENT_JS_SHOWCASE_G4_L10_ENABLED',
    'CURRENT_JS_SHOWCASE_G4_L11_ENABLED',
    'CURRENT_JS_SHOWCASE_G5_L3_ENABLED',
    'CURRENT_JS_SHOWCASE_G5_L4_ENABLED',
    'CURRENT_JS_SHOWCASE_G5_L5_ENABLED',
  ] as const) assert.equal(DEPLOYMENT_E2E_ENV[name], 'true', name);
});

test('deployment E2E grep-invert is regex-escaped and anchored to the exact names', () => {
  assert.equal(escapeRegExp('literal + [name] (v1)'), 'literal \\+ \\[name\\] \\(v1\\)');
  const pattern = new RegExp(DEPLOYMENT_E2E_GREP_INVERT_PATTERN, 'u');
  assert.equal(pattern.test(DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES[0]), true);
  assert.equal(pattern.test(`site.spec.ts ${DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES[0]}`), true);
  assert.equal(pattern.test(`${DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES[0]} extra`), false);
  assert.equal(pattern.test(`prefix ${DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES[0]} extra`), false);
  assert.equal(
    buildExactGrepInvertPattern(),
    DEPLOYMENT_E2E_GREP_INVERT_PATTERN,
  );
});

test('deployment E2E invocation binds Playwright to the five specs, workers=2, and shell false', () => {
  const baseEnv = {NODE_ENV: 'test'} as NodeJS.ProcessEnv;
  const invocation = buildDeploymentE2eInvocation({baseEnv});
  assert.equal(invocation.command, process.execPath);
  assert.equal(invocation.args[0], DEPLOYMENT_E2E_PLAYWRIGHT_CLI);
  assert.deepEqual(invocation.args.slice(1), [
    'test',
    ...DEPLOYMENT_E2E_SPEC_PATHS,
    '--workers=2',
    '--grep-invert',
    DEPLOYMENT_E2E_GREP_INVERT_PATTERN,
  ]);
  assert.equal(invocation.options.cwd, DEPLOYMENT_E2E_WEB_ROOT);
  assert.equal(invocation.options.env.NODE_ENV, 'test');
  assert.equal(invocation.options.env.CURRENT_JS_CANDIDATE_PROFILE_ENABLED, 'false');
  assert.equal(invocation.options.env.CURRENT_JS_SHOWCASE_G5_L5_ENABLED, 'true');
  assert.equal(invocation.options.shell, false);
  assert.equal(invocation.options.stdio, 'inherit');
});

test('deployment E2E runner rejects an extra spec or grep filter and preserves child status', async () => {
  assert.throws(
    () => buildDeploymentE2eInvocation({
      specPaths: [...DEPLOYMENT_E2E_SPEC_PATHS, 'e2e/extra.spec.ts'],
    }),
    /spec allowlist must match the exact approved list/u,
  );
  assert.throws(
    () => buildDeploymentE2eInvocation({
      grepInvertNames: DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES.slice(0, -1),
    }),
    /grep-invert names must match the exact approved list/u,
  );

  let captured: unknown[] | undefined;
  let child: EventEmitter | undefined;
  const fakeSpawn = (...arguments_: unknown[]): ChildProcess => {
    captured = arguments_;
    child = new EventEmitter();
    return child as unknown as ChildProcess;
  };
  const exitPromise = runDeploymentE2e({spawnImpl: fakeSpawn as unknown as typeof import('node:child_process').spawn});
  child!.emit('exit', 19, null);
  const exitResult = await exitPromise;
  assert.deepEqual(exitResult, {code: 19, signal: null});
  assert.equal(exitCodeFromChildStatus(exitResult), 19);
  assert.equal(captured![0], process.execPath);
  assert.equal((captured![2] as {shell: boolean}).shell, false);

  let signalChild: EventEmitter | undefined;
  const signalSpawn = (): ChildProcess => {
    signalChild = new EventEmitter();
    return signalChild as unknown as ChildProcess;
  };
  const signalPromise = runDeploymentE2e({spawnImpl: signalSpawn as unknown as typeof import('node:child_process').spawn});
  signalChild!.emit('exit', null, 'SIGTERM');
  const signalResult = await signalPromise;
  assert.deepEqual(signalResult, {code: null, signal: 'SIGTERM'});
  assert.equal(exitCodeFromChildStatus(signalResult), 143);
});
