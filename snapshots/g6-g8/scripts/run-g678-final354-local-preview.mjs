#!/usr/bin/env node

import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  g678LocalPreviewLaunch,
  parseG678LocalPreviewArguments,
} from './run-g678-local-preview.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_PHASE_ENV = 'HELP_MATH_G678_CALIBRATION_PHASE';
const FINAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function g678Final354LocalPreviewAdmission() {
  return Object.freeze({
    fragment: FINAL_FRAGMENT,
    phase: 'post-family-final354-registry-bound',
    provisionalBrowserQa: false,
  });
}

export function parseG678Final354LocalPreviewArguments(argv) {
  const checkCount = argv.filter((argument) => argument === '--check').length;
  invariant(checkCount <= 1, '--check may appear only once');
  const parsed = parseG678LocalPreviewArguments(argv.filter((argument) =>
    argument !== '--check'));
  return Object.freeze({...parsed, check: checkCount === 1});
}

export function g678Final354LocalPreviewLaunch({
  port,
  root = PROJECT_ROOT,
}) {
  const launch = g678LocalPreviewLaunch({port, root});
  const {[CALIBRATION_PHASE_ENV]: ignoredPhase, ...registryBoundEnvironment} =
    launch.env;
  void ignoredPhase;
  return Object.freeze({...launch,
    env: Object.freeze({...registryBoundEnvironment,
      HELP_MATH_G678_FINAL354_LOCAL_PREVIEW: 'true'}),
  });
}

async function runChecked(command, args, options) {
  const child = spawn(command, args, {...options, stdio: 'inherit'});
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  invariant(result.code === 0 && result.signal === null,
    `final354 local preview preflight failed: ${args.join(' ')}`);
}

async function runFinal354Preflight(root, environment) {
  const admission = g678Final354LocalPreviewAdmission();
  await runChecked(process.execPath,
    ['packages/demos/scripts/generate-registry.mjs', '--check'],
    {cwd: root, env: environment});
  await runChecked(process.execPath, [
    'scripts/upsert-private-current-js-calibration.mjs',
    '--check', '--calibration', admission.fragment,
  ], {cwd: root, env: environment});
}

async function main() {
  invariant(process.env.NODE_ENV !== 'production',
    'G678 final354 local preview cannot run with NODE_ENV=production');
  invariant(process.env.VERCEL_ENV === undefined,
    'G678 final354 local preview cannot run inside a Vercel environment');
  invariant(typeof process.env.HELP_MATH_G678_SOURCE_ROOT === 'string' &&
    path.isAbsolute(process.env.HELP_MATH_G678_SOURCE_ROOT),
  'HELP_MATH_G678_SOURCE_ROOT must be an absolute path');
  invariant(typeof process.env.PRIVATE_RECOVERY_CONTAINERS === 'string' &&
    path.isAbsolute(process.env.PRIVATE_RECOVERY_CONTAINERS),
  'PRIVATE_RECOVERY_CONTAINERS must be an absolute path');
  const parsed = parseG678Final354LocalPreviewArguments(
    process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      'Usage: node scripts/run-g678-final354-local-preview.mjs [--check] [--port <1024-65535>]\n',
    );
    return;
  }
  const launch = g678Final354LocalPreviewLaunch({port: parsed.port});
  await runFinal354Preflight(PROJECT_ROOT, launch.env);
  if (parsed.check) {
    process.stdout.write(`${JSON.stringify({
      check: true,
      fragment: g678Final354LocalPreviewAdmission().fragment,
      registryBound: true,
      serverStarted: false,
    }, null, 2)}\n`);
    return;
  }
  const child = spawn(launch.command, launch.args, {
    cwd: launch.cwd,
    env: launch.env,
    stdio: 'inherit',
  });
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  if (result.signal) process.kill(process.pid, result.signal);
  process.exitCode = result.code ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
