#!/usr/bin/env node

import {constants as osConstants} from 'node:os';
import path from 'node:path';
import {spawn as defaultSpawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const webRoot = path.resolve(import.meta.dirname, '..');
const projectRoot = path.resolve(webRoot, '../..');

export const DEPLOYMENT_E2E_SPEC_PATHS = Object.freeze([
  'e2e/site.spec.ts',
  'e2e/prototype-acceptance.spec.ts',
  'e2e/modern-wide-geometry.spec.ts',
  'e2e/canvas-sharpness.spec.ts',
  'e2e/learning-experience-polish.spec.ts',
]);

export const DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES = Object.freeze([
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

export const DEPLOYMENT_E2E_ENV = Object.freeze({
  CLERK_LOCAL_AUTH_ENABLED: 'false',
  CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'false',
  CURRENT_JS_SHOWCASE_G3_L2_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G4_L5_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G4_L10_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G4_L11_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G5_L3_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G5_L4_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G5_L5_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED: 'false',
  MODERN_WIDE_SHELL_ENABLED: 'true',
  NOVA_CLIENT_RENDER_MOCK_ENABLED: 'true',
  REVIEWER_INSTRUMENTATION_ENABLED: 'false',
});

export const DEPLOYMENT_E2E_WEB_ROOT = webRoot;
export const DEPLOYMENT_E2E_PLAYWRIGHT_CLI = path.join(
  projectRoot,
  'node_modules',
  '@playwright',
  'test',
  'cli.js',
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function escapeRegExp(value) {
  invariant(typeof value === 'string', 'grep-invert test name must be a string');
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export function buildExactGrepInvertPattern(
  names = DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES,
) {
  invariant(Array.isArray(names) && names.length > 0, 'grep-invert test names must not be empty');
  invariant(new Set(names).size === names.length, 'grep-invert test names contain duplicates');
  return `(?:^| )(?:${names.map(escapeRegExp).join('|')})$`;
}

export const DEPLOYMENT_E2E_GREP_INVERT_PATTERN = buildExactGrepInvertPattern();

function assertExactList(actual, expected, label) {
  invariant(Array.isArray(actual), `${label} must be an array`);
  invariant(
    actual.length === expected.length
      && actual.every((value, index) => value === expected[index]),
    `${label} must match the exact approved list`,
  );
}

export function buildDeploymentE2eInvocation({
  specPaths = DEPLOYMENT_E2E_SPEC_PATHS,
  grepInvertNames = DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES,
  cwd = webRoot,
  baseEnv = process.env,
  playwrightCli = DEPLOYMENT_E2E_PLAYWRIGHT_CLI,
} = {}) {
  assertExactList(specPaths, DEPLOYMENT_E2E_SPEC_PATHS, 'deployment E2E spec allowlist');
  assertExactList(
    grepInvertNames,
    DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES,
    'deployment E2E grep-invert names',
  );
  invariant(cwd === webRoot, 'deployment E2E cwd must be apps/web');
  invariant(playwrightCli === DEPLOYMENT_E2E_PLAYWRIGHT_CLI, 'deployment E2E Playwright CLI drifted');
  return Object.freeze({
    command: process.execPath,
    args: Object.freeze([
      playwrightCli,
      'test',
      ...specPaths,
      '--workers=2',
      '--grep-invert',
      buildExactGrepInvertPattern(grepInvertNames),
    ]),
    options: Object.freeze({
      cwd,
      env: Object.freeze({...baseEnv, ...DEPLOYMENT_E2E_ENV}),
      shell: false,
      stdio: 'inherit',
    }),
  });
}

export function runDeploymentE2e({spawnImpl = defaultSpawn, ...options} = {}) {
  const invocation = buildDeploymentE2eInvocation(options);
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnImpl(invocation.command, invocation.args, invocation.options);
    } catch (error) {
      reject(error);
      return;
    }
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      resolve(Object.freeze({
        code: code ?? null,
        signal: signal ?? null,
      }));
    });
  });
}

export function exitCodeFromChildStatus({code, signal}) {
  if (signal) {
    const signalNumber = osConstants.signals?.[signal];
    return typeof signalNumber === 'number' ? 128 + signalNumber : 1;
  }
  return code ?? 1;
}

export async function main() {
  process.stdout.write(
    `deployment E2E: specs=${DEPLOYMENT_E2E_SPEC_PATHS.length} `
      + `grep-invert=${DEPLOYMENT_E2E_SITE_GREP_INVERT_NAMES.length} workers=2\n`,
  );
  const result = await runDeploymentE2e();
  if (result.signal) process.stderr.write(`deployment E2E child received ${result.signal}\n`);
  return exitCodeFromChildStatus(result);
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) process.exitCode = await main();
