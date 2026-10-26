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
const FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.fragment.json';
const PHASE = 'alg-l11-remaining23-provisional-browser-qa';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function g678Provisional377LocalPreviewAdmission() {
  return Object.freeze({fragment: FRAGMENT, phase: PHASE,
    provisionalBrowserQa: true});
}

export function parseG678Provisional377LocalPreviewArguments(argv) {
  const checkCount = argv.filter((argument) => argument === '--check').length;
  invariant(checkCount <= 1, '--check may appear only once');
  const parsed = parseG678LocalPreviewArguments(argv.filter((argument) =>
    argument !== '--check'));
  return Object.freeze({...parsed, check: checkCount === 1});
}

export function g678Provisional377LocalPreviewLaunch({port,
  root = PROJECT_ROOT}) {
  const launch = g678LocalPreviewLaunch({port, root});
  return Object.freeze({...launch, env: Object.freeze({...launch.env,
    HELP_MATH_G678_CALIBRATION_PHASE: PHASE,
    HELP_MATH_G678_PROVISIONAL377_LOCAL_PREVIEW: 'true'})});
}

async function runChecked(command, args, options) {
  const child = spawn(command, args, {...options, stdio: 'inherit'});
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  invariant(result.code === 0 && result.signal === null,
    `provisional377 local preview preflight failed: ${args.join(' ')}`);
}

export function g678Provisional377LocalPreviewPreflightPlan() {
  return Object.freeze([
    Object.freeze(['packages/demos/scripts/generate-registry.mjs', '--check']),
    Object.freeze(['scripts/upsert-private-current-js-calibration.mjs',
      '--check', '--calibration', FRAGMENT, '--provisional-browser-qa']),
  ]);
}

async function runPreflight(root, environment) {
  for (const args of g678Provisional377LocalPreviewPreflightPlan()) {
    await runChecked(process.execPath, args, {cwd: root, env: environment});
  }
}

async function main() {
  invariant(process.env.NODE_ENV !== 'production',
    'G678 provisional377 local preview cannot run with NODE_ENV=production');
  invariant(process.env.VERCEL_ENV === undefined,
    'G678 provisional377 local preview cannot run inside a Vercel environment');
  invariant(typeof process.env.HELP_MATH_G678_SOURCE_ROOT === 'string' &&
    path.isAbsolute(process.env.HELP_MATH_G678_SOURCE_ROOT),
  'HELP_MATH_G678_SOURCE_ROOT must be an absolute path');
  invariant(typeof process.env.PRIVATE_RECOVERY_CONTAINERS === 'string' &&
    path.isAbsolute(process.env.PRIVATE_RECOVERY_CONTAINERS),
  'PRIVATE_RECOVERY_CONTAINERS must be an absolute path');
  const parsed = parseG678Provisional377LocalPreviewArguments(
    process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      'Usage: node scripts/run-g678-provisional377-local-preview.mjs [--check] [--port <1024-65535>]\n');
    return;
  }
  const launch = g678Provisional377LocalPreviewLaunch({port: parsed.port});
  await runPreflight(PROJECT_ROOT, launch.env);
  if (parsed.check) {
    process.stdout.write(`${JSON.stringify({check: true, fragment: FRAGMENT,
      phase: PHASE, registryBound: true, provisionalBrowserQa: true,
      serverStarted: false}, null, 2)}\n`);
    return;
  }
  const child = spawn(launch.command, launch.args, {cwd: launch.cwd,
    env: launch.env, stdio: 'inherit'});
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
