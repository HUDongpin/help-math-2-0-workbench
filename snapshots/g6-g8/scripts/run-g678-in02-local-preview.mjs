#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const LOOPBACK_HOST = '127.0.0.1';
const DEFAULT_PORT = 3319;
const CALIBRATION_PHASE_ENV = 'HELP_MATH_G678_CALIBRATION_PHASE';
const PROVISIONAL_PHASE = 'provisional-browser-qa';
const IN02_PROVISIONAL_PHASE = 'in02-provisional-browser-qa';
const VB02_PROVISIONAL_PHASE = 'vb02-provisional-browser-qa';
const VB03_PROVISIONAL_PHASE = 'vb03-provisional-browser-qa';
const ALG_L09_GLOSSARY_PROVISIONAL_PHASE =
  'alg-l09-simple-glossary-provisional-browser-qa';
const ALG_L09_TERMINAL_STOP_PROVISIONAL_PHASE =
  'alg-l09-terminal-stop-provisional-browser-qa';
const ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_PHASE =
  'alg-l09-vb03-terminal-stop-provisional-browser-qa';
const ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_PHASE =
  'alg-l09-intro-shell-linkage-provisional-browser-qa';
const PREDECESSOR_RECALIBRATION_PHASE =
  'predecessor-browser-recalibration';
const PROVISIONAL_FRAGMENT =
  'g678-current-js-276-page-registration-v1.fragment.json';
const IN02_PROVISIONAL_FRAGMENT =
  'g678-current-js-290-page-registration-v1.fragment.json';
const VB02_PROVISIONAL_FRAGMENT =
  'g678-current-js-301-page-registration-v1.fragment.json';
const VB03_PROVISIONAL_FRAGMENT =
  'g678-current-js-310-page-registration-v1.fragment.json';
const ALG_L09_GLOSSARY_PROVISIONAL_FRAGMENT =
  'g678-current-js-319-page-registration-v1.fragment.json';
const ALG_L09_TERMINAL_STOP_PROVISIONAL_FRAGMENT =
  'g678-current-js-322-page-registration-v1.fragment.json';
const ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_FRAGMENT =
  'g678-current-js-323-page-registration-v1.fragment.json';
const ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_FRAGMENT =
  'g678-current-js-324-page-registration-v1.fragment.json';
const PREDECESSOR_PROVISIONAL_FRAGMENT =
  'g678-current-js-261-page-registration-v1.fragment.json';
const PRIVATE_REGISTRY =
  'packages/demos/private-current-js-registry.json';
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const CANONICAL_FREEZE =
  /^catalog\/product-bridge-calibrations\/g678-current-js-\d+-page(?:-product-calibrated)?-registration-v1\.json$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function parseG678LocalPreviewArguments(argv) {
  let port = DEFAULT_PORT;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--port') {
      invariant(index + 1 < argv.length, '--port requires a value');
      const value = argv[++index];
      invariant(/^[1-9][0-9]{3,4}$/u.test(value), 'port must be a canonical integer');
      port = Number(value);
      invariant(port >= 1024 && port <= 65_535, 'port must be between 1024 and 65535');
      continue;
    }
    if (argument === '--help' || argument === '-h') return {help: true, port};
    throw new Error(`unsupported argument: ${argument}`);
  }
  return {help: false, port};
}

export function g678LocalPreviewLaunch({port, root = PROJECT_ROOT}) {
  const resolvedRoot = path.resolve(root);
  const nextEntrypoint = realpathSync(path.join(
    resolvedRoot,
    'node_modules/next/dist/bin/next',
  ));
  return Object.freeze({
    command: process.execPath,
    args: Object.freeze([
      nextEntrypoint,
      'dev',
      '--webpack',
      '--hostname',
      LOOPBACK_HOST,
      '--port',
      String(port),
    ]),
    cwd: path.join(resolvedRoot, 'apps/web'),
    env: Object.freeze({
      ...process.env,
      HELP_MATH_G678_LOCAL_PREVIEW: 'true',
      HELP_MATH_G678_LOCAL_PREVIEW_BIND: LOOPBACK_HOST,
      HELP_MATH_G678_DEMOS_SOURCE_ROOT:
        path.join(resolvedRoot, 'packages/demos/src'),
    }),
  });
}

function registryBoundFinalFragment(root = PROJECT_ROOT) {
  const registryPath = path.join(root, PRIVATE_REGISTRY);
  const metadata = lstatSync(registryPath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() &&
    metadata.nlink === 1 && realpathSync(registryPath) === registryPath,
  'private Current-JS registry must be one canonical ordinary file');
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  invariant(Array.isArray(registry.calibrations),
    'private Current-JS registry calibrations are invalid');
  const calibrations = registry.calibrations.filter((calibration) =>
    calibration.calibrationId === CALIBRATION_ID);
  invariant(calibrations.length === 1 &&
    calibrations[0].deploymentScope === 'local-only' &&
    CANONICAL_FREEZE.test(calibrations[0].freezeManifest),
  'private Current-JS registry has no unique canonical G678 calibration');
  return path.basename(calibrations[0].freezeManifest).replace(/\.json$/u,
    '.fragment.json');
}

async function runChecked(command, args, options) {
  const child = spawn(command, args, {...options, stdio: 'inherit'});
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  invariant(result.code === 0 && result.signal === null,
    `local preview preflight failed: ${args.join(' ')}`);
}

export function g678LocalPreviewCalibrationAdmission(environment = process.env) {
  const phase = environment[CALIBRATION_PHASE_ENV];
  invariant(phase === undefined || phase === PROVISIONAL_PHASE ||
    phase === IN02_PROVISIONAL_PHASE ||
    phase === VB02_PROVISIONAL_PHASE ||
    phase === VB03_PROVISIONAL_PHASE ||
    phase === ALG_L09_GLOSSARY_PROVISIONAL_PHASE ||
    phase === ALG_L09_TERMINAL_STOP_PROVISIONAL_PHASE ||
    phase === ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_PHASE ||
    phase === ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_PHASE ||
    phase === PREDECESSOR_RECALIBRATION_PHASE,
    `${CALIBRATION_PHASE_ENV} is invalid`);
  return Object.freeze({
    fragment: phase === PREDECESSOR_RECALIBRATION_PHASE
      ? PREDECESSOR_PROVISIONAL_FRAGMENT
      : phase === IN02_PROVISIONAL_PHASE
        ? IN02_PROVISIONAL_FRAGMENT
      : phase === VB02_PROVISIONAL_PHASE
        ? VB02_PROVISIONAL_FRAGMENT
      : phase === VB03_PROVISIONAL_PHASE
        ? VB03_PROVISIONAL_FRAGMENT
      : phase === ALG_L09_GLOSSARY_PROVISIONAL_PHASE
        ? ALG_L09_GLOSSARY_PROVISIONAL_FRAGMENT
      : phase === ALG_L09_TERMINAL_STOP_PROVISIONAL_PHASE
        ? ALG_L09_TERMINAL_STOP_PROVISIONAL_FRAGMENT
      : phase === ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_PHASE
        ? ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_FRAGMENT
      : phase === ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_PHASE
        ? ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_FRAGMENT
      : phase === PROVISIONAL_PHASE
        ? PROVISIONAL_FRAGMENT
        : registryBoundFinalFragment(),
    provisionalBrowserQa: phase === PROVISIONAL_PHASE ||
      phase === IN02_PROVISIONAL_PHASE ||
      phase === VB02_PROVISIONAL_PHASE ||
      phase === VB03_PROVISIONAL_PHASE ||
      phase === ALG_L09_GLOSSARY_PROVISIONAL_PHASE ||
      phase === ALG_L09_TERMINAL_STOP_PROVISIONAL_PHASE ||
      phase === ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_PHASE ||
      phase === ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_PHASE ||
      phase === PREDECESSOR_RECALIBRATION_PHASE,
  });
}

async function runG678LocalPreviewPreflight(root) {
  // The admission chain executes bound Java/FFDec/swfmill paths and rejects
  // Java/FFDec injection variables itself. PATH is therefore not a compiler
  // identity and must not be reconstructed from a historical process.
  const preflightEnvironment = Object.freeze({...process.env});
  const admission = g678LocalPreviewCalibrationAdmission(
    preflightEnvironment,
  );
  const commands = [
    ['packages/demos/scripts/generate-registry.mjs', '--check'],
    [
      'scripts/upsert-private-current-js-calibration.mjs',
      '--check',
      '--calibration',
      'catalog/product-bridge-calibrations/' +
        admission.fragment,
      ...(admission.provisionalBrowserQa
        ? ['--provisional-browser-qa']
        : []),
    ],
  ];
  for (const args of commands) {
    await runChecked(process.execPath, args, {
      cwd: root,
      env: preflightEnvironment,
    });
  }
}

async function main() {
  invariant(process.env.NODE_ENV !== 'production',
    'G678 local preview cannot run with NODE_ENV=production');
  invariant(process.env.VERCEL_ENV === undefined,
    'G678 local preview cannot run inside a Vercel environment');
  invariant(
    typeof process.env.HELP_MATH_G678_SOURCE_ROOT === 'string' &&
      process.env.HELP_MATH_G678_SOURCE_ROOT.length > 0,
    'HELP_MATH_G678_SOURCE_ROOT is required for the local preview preflight',
  );
  invariant(
    typeof process.env.PRIVATE_RECOVERY_CONTAINERS === 'string' &&
      process.env.PRIVATE_RECOVERY_CONTAINERS.length > 0,
    'PRIVATE_RECOVERY_CONTAINERS is required for the local preview preflight',
  );
  const options = parseG678LocalPreviewArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      'Usage: npm run dev:g678:local -- [--port 3319]\n' +
      'The launcher always binds Next.js webpack dev to 127.0.0.1.\n',
    );
    return;
  }
  await runG678LocalPreviewPreflight(PROJECT_ROOT);
  const launch = g678LocalPreviewLaunch(options);
  const child = spawn(launch.command, launch.args, {
    cwd: launch.cwd,
    env: launch.env,
    stdio: 'inherit',
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => child.kill(signal));
  }
  const exit = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  if (exit.signal) process.kill(process.pid, exit.signal);
  process.exitCode = exit.code ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
