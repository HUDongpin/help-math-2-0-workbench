#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {g678LocalPreviewLaunch, parseG678LocalPreviewArguments} from './run-g678-local-preview.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
export const MATH_COMPANION_PREVIEW_PHASE = 'alg-l11-math-companion-provisional-browser-qa';
export const MATH_COMPANION_PREVIEW_PREFLIGHT = Object.freeze([
  Object.freeze(['scripts/activate-g678-alg-l11-math-companion-registration.mjs', '--check']),
  Object.freeze(['packages/demos/scripts/generate-registry.mjs', '--check']),
]);
export function mathCompanionPreviewLaunch({port, root = ROOT}) {
  const launch = g678LocalPreviewLaunch({port, root});
  return {...launch, env: {...launch.env, HELP_MATH_G678_CALIBRATION_PHASE: MATH_COMPANION_PREVIEW_PHASE}};
}
async function runPreflight(args, env) {
  const child = spawn(process.execPath, args, {cwd: ROOT, env, stdio: 'inherit'});
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject); child.once('exit', (code, signal) => resolve({code, signal}));
  });
  assert.ok(result.code === 0 && result.signal === null, `V4 local preview preflight failed: ${args[0]}`);
}
async function main() {
  assert.notEqual(process.env.NODE_ENV, 'production', 'Local preview cannot run in production');
  assert.equal(process.env.VERCEL_ENV, undefined, 'Local preview cannot run in a provider environment');
  for (const name of ['HELP_MATH_G678_SOURCE_ROOT', 'PRIVATE_RECOVERY_CONTAINERS'])
    assert.ok(process.env[name] && path.isAbsolute(process.env[name]), `Missing exact local source root: ${name}`);
  const args = process.argv.slice(2), checkOnly = args.includes('--check');
  assert.ok(args.filter(arg => arg === '--check').length <= 1);
  const options = parseG678LocalPreviewArguments(args.filter(arg => arg !== '--check'));
  if (options.help) {console.log('Usage: run-g678-math-companion-local-preview.mjs [--check] [--port <1024-65535>]'); return;}
  const launch = mathCompanionPreviewLaunch({port: options.port});
  for (const args of MATH_COMPANION_PREVIEW_PREFLIGHT) await runPreflight(args, launch.env);
  if (checkOnly) {console.log(JSON.stringify({preflightPassed: true, host: '127.0.0.1', port: options.port,
    phase: MATH_COMPANION_PREVIEW_PHASE, serverStarted: false, providerAccessed: false})); return;}
  const child = spawn(launch.command, launch.args, {cwd: launch.cwd, env: launch.env, stdio: 'inherit'});
  const forward = signal => {if (child.exitCode === null && child.signalCode === null) child.kill(signal);};
  process.once('SIGINT', () => forward('SIGINT'));
  process.once('SIGTERM', () => forward('SIGTERM'));
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject); child.once('exit', (code, signal) => resolve({code, signal}));
  });
  process.exitCode = result.code ?? (result.signal ? 1 : 0);
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT)
  main().catch(error => {console.error(error); process.exitCode = 1;});
