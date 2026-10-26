#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {g678LocalPreviewLaunch, parseG678LocalPreviewArguments} from './run-g678-local-preview.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
export const FEEDBACK_HOST_SCORE_PREVIEW_PHASE = 'alg-l11-feedback-host-score-successor-provisional-browser-qa';
export function feedbackHostScorePreviewLaunch({port, root = ROOT}) {
  const launch = g678LocalPreviewLaunch({port, root});
  return {...launch, env: {...launch.env, HELP_MATH_G678_CALIBRATION_PHASE: FEEDBACK_HOST_SCORE_PREVIEW_PHASE}};
}
export const FEEDBACK_HOST_SCORE_PREVIEW_PREFLIGHT = Object.freeze([
  Object.freeze(['scripts/activate-g678-alg-l11-feedback-host-score-registration.mjs', '--check']),
  Object.freeze(['packages/demos/scripts/generate-registry.mjs', '--check']),
]);
async function command(args, {cwd, env}) {
  const child = spawn(process.execPath, args, {cwd, env, stdio: 'inherit'});
  const {code, signal} = await new Promise((resolve, reject) => {
    child.once('error', reject); child.once('exit', (code, signal) => resolve({code, signal}));
  });
  assert.ok(code === 0 && signal === null, `Local behavior successor preflight failed: ${args[0]}`);
}
async function main() {
  assert.notEqual(process.env.NODE_ENV, 'production', 'Local preview cannot run in production');
  assert.equal(process.env.VERCEL_ENV, undefined, 'Local preview cannot run in a provider environment');
  for (const name of ['HELP_MATH_G678_SOURCE_ROOT', 'PRIVATE_RECOVERY_CONTAINERS']) {
    assert.ok(process.env[name] && path.isAbsolute(process.env[name]), `Missing exact local source root: ${name}`);
  }
  const args = process.argv.slice(2), checkOnly = args.includes('--check');
  assert.ok(args.filter(a => a === '--check').length <= 1);
  const parsed = parseG678LocalPreviewArguments(args.filter(a => a !== '--check'));
  if (parsed.help) {console.log('Usage: run-g678-feedback-host-score-local-preview.mjs [--check] [--port <1024-65535>]'); return;}
  const launch = feedbackHostScorePreviewLaunch({port: parsed.port});
  for (const args of FEEDBACK_HOST_SCORE_PREVIEW_PREFLIGHT) await command(args, {cwd: ROOT, env: launch.env});
  if (checkOnly) {console.log(JSON.stringify({preflightPassed: true, host: '127.0.0.1', port: parsed.port,
    phase: FEEDBACK_HOST_SCORE_PREVIEW_PHASE, serverStarted: false, providerAccessed: false})); return;}
  const child = spawn(launch.command, launch.args, {cwd: launch.cwd, env: launch.env, stdio: 'inherit'});
  const forwardSignal = signal => {if (child.exitCode === null && child.signalCode === null) child.kill(signal);};
  process.once('SIGINT', () => forwardSignal('SIGINT'));
  process.once('SIGTERM', () => forwardSignal('SIGTERM'));
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject); child.once('exit', (code, signal) => resolve({code, signal}));
  });
  process.exitCode = result.code ?? (result.signal ? 1 : 0);
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT) main().catch(error => {console.error(error); process.exitCode = 1;});
