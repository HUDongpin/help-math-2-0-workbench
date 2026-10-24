#!/usr/bin/env node
/** Add the ALG L12 pair's shared runtime and candidate host to a new host
 * version. No prior proof, registration, index or activation byte is edited.
 * The old refresh tool handles changed existing inputs only; this successor
 * also admits an explicitly reviewed, page-independent host closure. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile, readJsonPin, readPageProof, readPin, readRegistryTransaction,
  uniquePins, verifyAdmission, verifyHostVersion} from '../lib/g678-admission-proof.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_INDEX = 'catalog/g678-admission-v1/index-v7.json';
const BASE_HOST = 'catalog/g678-admission-v1/host-v6.json';
const NEXT_HOST = 'catalog/g678-admission-v1/host-v7.json';
const NEXT_INDEX = 'catalog/g678-admission-v1/index-v8.json';
const PAIR_OUTPUT = 'output/alg-l12-next-glossary-20260927';
const EXPECTED_PAGES = [
  'shared-alg001-l12-p006', 'shared-alg001-l12-p009',
  'shared-alg001-l12-p010', 'shared-alg001-l12-p012',
];

/** Explicit shared closure only. The P013/P015 wrappers, timelines, native
 * Canvas/MP3 and source audits are owned by their separate page proofs. */
export const PAIR_HOST_ADDITIONS = Object.freeze([
  'apps/web/components/g678-glossary-pair-host-lesson.tsx',
  'apps/web/components/source-glossary-lesson-runtime.tsx',
  'apps/web/lib/g678-glossary-pair-asset-route.ts',
  'apps/web/lib/g678-glossary-pair-assets.server.ts',
  'apps/web/lib/g678-glossary-pair-host-probe.server.ts',
  'apps/web/lib/g678-glossary-pair-host.production-stub.tsx',
  'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p013/page.tsx',
  'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p015/page.tsx',
  'apps/web/app/flash-assets/g678-local/shared-alg001-l12-p013/[asset]/route.ts',
  'apps/web/app/flash-assets/g678-local/shared-alg001-l12-p015/[asset]/route.ts',
  'apps/web/tests/g678-glossary-pair-assets.server-test.ts',
  'packages/demos/src/source-glossary-controls.tsx',
  'packages/demos/src/source-glossary-session.ts',
  'packages/demos/src/alg-l12-glossary-pair-assets.ts',
  'packages/demos/src/alg-l12-glossary-pair-audio-loader.ts',
  'packages/demos/src/alg-l12-glossary-pair-audio-schedule.ts',
  'packages/demos/src/alg-l12-glossary-pair-audio-spanish.ts',
  'packages/demos/src/alg-l12-glossary-pair-audio.ts',
  'packages/demos/src/alg-l12-glossary-pair-module.tsx',
  'packages/demos/src/alg-l12-glossary-pair-native.css',
  'packages/demos/src/alg-l12-glossary-pair-renderer.tsx',
  'packages/demos/src/alg-l12-glossary-pair-timeline.ts',
  'packages/demos/src/alg-l12-p013-p015-native-text.ts',
  'packages/demos/src/generated/alg-l12-glossary-pair-controls.ts',
  'packages/demos/src/generated/alg-l12-glossary-pair-native-assets.json',
  'packages/demos/src/generated/alg-l12-p013-p015-native-text-data.ts',
  'packages/demos/tests/alg-l12-glossary-pair-audio.test.ts',
  'packages/demos/tests/alg-l12-glossary-pair-controls.test.ts',
  'packages/demos/tests/alg-l12-p013-p015-native-text.test.ts',
  'packages/demos/tests/source-glossary-session.test.ts',
  `${PAIR_OUTPUT}/source-inputs.json`,
  `${PAIR_OUTPUT}/host-resources-v1.json`,
  'scripts/build-g678-alg-l12-glossary-pair-inputs.mjs',
  'scripts/build-g678-alg-l12-glossary-pair-controls.mjs',
  'scripts/build-g678-alg-l12-glossary-pair-canvas.mjs',
  'scripts/build-g678-alg-l12-glossary-pair-canvas.test.mjs',
  'scripts/build-g678-alg-l12-glossary-pair-audio.mjs',
  'scripts/build-g678-alg-l12-glossary-pair-audio.test.mjs',
  'scripts/build-g678-alg-l12-glossary-pair-native-text.mjs',
  'scripts/build-g678-alg-l12-glossary-pair-native-text.test.mjs',
  'scripts/build-g678-alg-l12-glossary-pair-native-canvas.mjs',
  'scripts/build-g678-alg-l12-glossary-pair-native-canvas.test.mjs',
  'scripts/prepare-g678-glossary-pair-host-assets.mjs',
  'scripts/prepare-g678-glossary-pair-host-successor.mjs',
]);

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const demand = (value, reason) => assert(value, `G678_PAIR_HOST_SUCCESSOR: ${reason}`);

function activeIndexPin(root) {
  const source = fs.readFileSync(path.join(root, 'apps/web/lib/g678-admission-activation.ts'), 'utf8');
  const match = source.match(/export const G678_ADMISSION_INDEX = (\{[\s\S]*?\}) as const;/);
  demand(match, 'parse active admission pin');
  const pin = JSON.parse(match[1]);
  assert.deepStrictEqual(pin, pinFile(root, BASE_INDEX), 'reviewed index-v7 still active');
  return pin;
}

function pageOwned(relative) {
  return /^packages\/demos\/src\/(?:modules|timelines)\/shared-alg001-l12-p01[35]\.tsx?$/.test(relative) ||
    /^lib\/g678-glossary-pair-admission-semantics(?:\.test)?\.mjs$/.test(relative) ||
    /^scripts\/prepare-g678-glossary-pair-admission(?:\.test)?\.mjs$/.test(relative) ||
    relative === 'apps/web/lib/g678-glossary-pair-admission.server.ts' ||
    /^apps\/web\/lib\/g678-alg-l12-p01[35]-admission\.server\.ts$/.test(relative) ||
    new RegExp(`^${PAIR_OUTPUT.replaceAll('/', '\\/')}\/(?:p013|p015|candidates|native-candidates|native-text|audio)\/`).test(relative);
}

/** Read-only plan. Changed legacy host paths must be passed explicitly and
 * must match the actual changed set; unexpected drift is never repinned. */
export function buildPairHostSuccessorPlan({root = ROOT, reviewedChanged = []} = {}) {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV,
    'local engineering only');
  demand(fs.realpathSync(root) === root && fs.lstatSync(root).isDirectory(), 'physical worktree');
  const indexPin = activeIndexPin(root), index = readJsonPin(root, indexPin);
  assert.deepStrictEqual(index.host, pinFile(root, BASE_HOST), 'reviewed host-v6 source');
  assert.deepStrictEqual(index.pages.map(page => page.animationId), EXPECTED_PAGES,
    'four exact historical pages');
  const oldHost = readJsonPin(root, index.host);
  demand(oldHost.schemaVersion === 1 && oldHost.kind === 'g678-admission-host-v1' &&
    oldHost.contract === 'source-native-current-js-v1', 'host contract');
  const oldPaths = new Set(oldHost.files.map(item => item.path));
  demand(new Set(PAIR_HOST_ADDITIONS).size === PAIR_HOST_ADDITIONS.length &&
    PAIR_HOST_ADDITIONS.every(relative => !oldPaths.has(relative) && !pageOwned(relative)),
  'additions are new shared host inputs only');
  demand(reviewedChanged.every(relative => oldPaths.has(relative) && !pageOwned(relative)),
    'changed path belongs to existing host');
  const changed = oldHost.files.filter(item => {
    try {return JSON.stringify(pinFile(root, item.path)) !== JSON.stringify(item);}
    catch {return true;}
  }).map(item => item.path).sort();
  assert.deepStrictEqual([...new Set(reviewedChanged)].sort(), changed,
    'explicit reviewed existing-host delta equals actual delta');
  const transaction = readRegistryTransaction(root);
  const oldRegistration = transaction.registry.calibrations.map(c => c.calibrationId);
  const oldProofPins = index.pages.map(page => page.proof);
  for (const proof of oldProofPins) readPin(root, proof);
  const additions = PAIR_HOST_ADDITIONS.map(relative => pinFile(root, relative));
  const nextFiles = uniquePins([...oldHost.files.map(item => changed.includes(item.path) ?
    pinFile(root, item.path) : item), ...additions]);
  const nextHost = {...oldHost, previous: index.host,
    legacyInputTransitions: oldHost.legacyInputTransitions?.map(transition =>
      changed.includes(transition.current.path) ? {...transition,
        current: pinFile(root, transition.current.path)} : transition),
    files: nextFiles};
  const nextHostBytes = json(nextHost), hostPin = {path: NEXT_HOST,
    bytes: nextHostBytes.length, sha256: sha256(nextHostBytes)};
  const nextIndex = {...index, host: hostPin};
  const nextIndexBytes = json(nextIndex), nextIndexPin = {path: NEXT_INDEX,
    bytes: nextIndexBytes.length, sha256: sha256(nextIndexBytes)};
  // The four immutable proofs must survive the actual common reader with the
  // proposed host. This check is possible before creating either output.
  demand(nextHost.files.every(item => {readPin(root, item); return true;}), 'current host input bytes');
  for (const proof of index.pages) readPageProof(root, proof.proof, nextHost, transaction);
  assert.deepStrictEqual(index.pages.map(page => page.proof), oldProofPins, 'old proof pins retained');
  assert.deepStrictEqual(transaction.registry.calibrations.map(c => c.calibrationId), oldRegistration,
    'registration transaction retained');
  return {indexPin, oldHostPin: index.host, oldProofPins,
    registryPin: pinFile(root, 'packages/demos/private-current-js-registry.json'),
    additions, changed, hostPin, indexPinNext: nextIndexPin,
    outputs: [{path: NEXT_HOST, bytes: nextHostBytes}, {path: NEXT_INDEX, bytes: nextIndexBytes}]};
}

function exclusiveWrite(root, relative, bytes) {
  const target = path.join(root, relative);
  fs.writeFileSync(target, bytes, {flag: 'wx'});
  assert.deepStrictEqual(pinFile(root, relative),
    {path: relative, bytes: bytes.length, sha256: sha256(bytes)}, `read-back ${relative}`);
}

export function preparePairHostSuccessor(plan, root = ROOT) {
  demand(plan.outputs.every(item => !fs.existsSync(path.join(root, item.path))),
    'new host and index paths absent');
  for (const item of plan.outputs) exclusiveWrite(root, item.path, item.bytes);
  const verified = verifyAdmission(root, plan.indexPinNext);
  assert.deepStrictEqual(verified.index.pages.map(page => page.proof), plan.oldProofPins,
    'real reader retained four page proofs');
  assert.deepStrictEqual(pinFile(root, 'packages/demos/private-current-js-registry.json'),
    plan.registryPin, 'registration bytes unchanged');
  assert.deepStrictEqual(pinFile(root, BASE_INDEX), plan.indexPin, 'active old index bytes unchanged');
  return {status: 'PAIR_HOST_SUCCESSOR_PREPARED_NOT_ACTIVATED',
    host: plan.hostPin, index: plan.indexPinNext,
    retainedPageProofs: plan.oldProofPins.length, registrationEffect: 'none', activationEffect: 'none'};
}

export function checkPairHostSuccessor(plan, root = ROOT) {
  for (const item of plan.outputs)
    demand(readPin(root, {path: item.path, bytes: item.bytes.length,
      sha256: sha256(item.bytes)}).equals(item.bytes), `current ${item.path}`);
  const verified = verifyAdmission(root, plan.indexPinNext);
  assert.deepStrictEqual(verified.index.pages.map(page => page.proof), plan.oldProofPins);
  return {status: 'PAIR_HOST_SUCCESSOR_CHECKED_NOT_ACTIVATED',
    host: plan.hostPin, index: plan.indexPinNext,
    retainedPageProofs: plan.oldProofPins.length, registrationEffect: 'none', activationEffect: 'none'};
}

export function main(argv = process.argv.slice(2)) {
  const [mode, ...reviewedChanged] = argv;
  demand(['--dry-run','--prepare','--check'].includes(mode),
    'use --dry-run, --prepare or --check followed by exact changed host paths');
  const plan = buildPairHostSuccessorPlan({reviewedChanged});
  const result = mode === '--prepare' ? preparePairHostSuccessor(plan) :
    mode === '--check' ? checkPairHostSuccessor(plan) :
    {status: 'PAIR_HOST_SUCCESSOR_INPUTS_VERIFIED_NOT_WRITTEN',
      changedExisting: plan.changed, additions: plan.additions.map(item => item.path),
      host: plan.hostPin, index: plan.indexPinNext,
      retainedPageProofs: plan.oldProofPins.length,
      registrationEffect: 'none', activationEffect: 'none'};
  process.stdout.write(JSON.stringify(result) + '\n');
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {main();} catch (error) {process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1;}
}
