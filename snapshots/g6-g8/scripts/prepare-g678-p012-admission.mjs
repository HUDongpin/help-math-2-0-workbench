#!/usr/bin/env node
/** P012 page-only admission producer. `--prepare` writes an immutable candidate,
 * never the registry, active index, activation pointer, or prior page proof. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  pinFile, readJsonPin, readPageProof, readPin, readRegistryTransaction, verifyHostVersion,
} from '../lib/g678-admission-proof.mjs';
import {prepareAdmissionCandidate} from './lib/g678-admission-candidate.mjs';
import {
  P012_ADMISSION_ACCEPTANCE_KEYS, P012_ADMISSION_CALIBRATION,
  P012_ADMISSION_COACH, P012_ADMISSION_DIRECTIONS, P012_ADMISSION_ID,
  P012_ADMISSION_PREDECESSOR, P012_ADMISSION_RUNTIME, P012_ADMISSION_SA,
  P012_ADMISSION_SOURCE, P012_ADMISSION_SOURCE_ROOT, P012_ADMISSION_XML,
  validateP012AdmissionSemantics,
} from '../lib/g678-p012-admission-semantics.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = P012_ADMISSION_ID, CALIBRATION = P012_ADMISSION_CALIBRATION;
const WORK = `migrations/${ID}`;
const TRIAGE = 'output/p011-source-triage-20260927-v1';
const FREEZE = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const FRAGMENT = `catalog/product-bridge-calibrations/${CALIBRATION}.fragment.json`;
const CANDIDATE = `work/g678-workflow/candidates/${ID}-v1.json`;
const PREPARED_RUNTIME = P012_ADMISSION_RUNTIME.path;
const NATIVE_RUNTIME = `${WORK}/typography-v1/renderer.js`;
const SOURCE_SHA = P012_ADMISSION_SOURCE.sha256;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const demand = (value, reason) => assert(value, `P012_ADMISSION_PREPARE: ${reason}`);

/** One page's own implementation, source audit and maintained generation
 * chain. Shared host files stay in the independently versioned host contract;
 * only the immediate P010 freeze pin enters this page's predecessor closure. */
function pageInputPaths(root) {
  const files = new Set([
    P012_ADMISSION_PREDECESSOR.freezeManifest.path,
    'lib/g678-p012-admission-semantics.mjs',
    'lib/g678-p012-admission-semantics.test.mjs',
    'scripts/prepare-g678-p012-admission.mjs',
    'scripts/prepare-g678-p012-admission.test.mjs',
    'scripts/lib/g678-admission-candidate.mjs',
    'scripts/lib/swf-text-source-catalog.mjs',
    'packages/demos/src/modules/shared-alg001-l12-p012.tsx',
    'packages/demos/src/timelines/shared-alg001-l12-p012.ts',
    'packages/demos/src/generated/alg-l12-p012-text-data.ts',
    'packages/demos/src/alg-l12-p012-text-binding.ts',
    'apps/web/components/g678-alg-l12-p012-host-lesson.tsx',
    'apps/web/lib/g678-alg-l12-p012-admission.server.ts',
    'apps/web/lib/g678-alg-l12-p012-assets.server.ts',
    'apps/web/lib/g678-alg-l12-p012-host-probe.server.ts',
    'apps/web/lib/g678-alg-l12-p012-host.production-stub.tsx',
    `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  ]);
  const walk = relative => {
    const full = path.join(root, relative);
    for (const name of fs.readdirSync(full).sort()) {
      const item = `${relative}/${name}`;
      const stat = fs.lstatSync(path.join(root, item));
      demand(!stat.isSymbolicLink(), `no symbolic source input: ${item}`);
      if (stat.isDirectory()) walk(item);
      else {demand(stat.isFile(), `ordinary source input: ${item}`); files.add(item);}
    }
  };
  walk(WORK);
  walk(TRIAGE);
  walk(`apps/web/app/flash-assets/g678-local/${ID}`);
  for (const [directory, pattern] of [
    ['packages/demos/src', /^alg-l12-p012(?:[.-]|$)/],
    ['packages/demos/tests', /^alg-l12-p012(?:[.-]|$)/],
    ['apps/web/tests', /^g678-alg-l12-p012(?:[.-]|$)/],
    ['scripts', /^build-g678-alg-l12-p012(?:[.-]|$)/],
  ]) {
    for (const name of fs.readdirSync(path.join(root, directory))) {
      if (pattern.test(name)) files.add(`${directory}/${name}`);
    }
  }
  return [...files].sort();
}

function physicalSource(root, sourceRoot) {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV,
    'local engineering only');
  demand(root === fs.realpathSync(root) && fs.lstatSync(root).isDirectory(), 'physical workspace root');
  demand(sourceRoot === P012_ADMISSION_SOURCE_ROOT && sourceRoot === fs.realpathSync(sourceRoot) &&
    fs.lstatSync(sourceRoot).isDirectory() && !fs.lstatSync(sourceRoot).isSymbolicLink(),
  'real AWS source root opt-in');
  for (const expected of [P012_ADMISSION_SOURCE, P012_ADMISSION_XML, P012_ADMISSION_SA])
    assert.deepStrictEqual(pinFile(sourceRoot, expected.path), expected, `physical ${expected.path}`);
}

function currentHost(root) {
  // The activation pointer selects a reviewed host version. It is read only;
  // this producer does not add P012 to the index or activate the candidate.
  const activation = fs.readFileSync(path.join(root, 'apps/web/lib/g678-admission-activation.ts'), 'utf8');
  const match = activation.match(/export const G678_ADMISSION_INDEX = (\{[\s\S]*?\}) as const;/);
  demand(match, 'parse current activation pin');
  const index = readJsonPin(root, JSON.parse(match[1]));
  demand(index.schemaVersion === 1 && index.kind === 'g678-admission-index-v1' &&
    index.pages.every(page => page.animationId !== ID), 'candidate absent from active admission index');
  verifyHostVersion(root, index.host);
  return index.host;
}

function packetFor(pins) {
  const get = relative => {const found = pins.get(relative); demand(found, `current input ${relative}`); return found;};
  const module = get(`packages/demos/src/modules/${ID}.tsx`);
  const timeline = get(`packages/demos/src/timelines/${ID}.ts`);
  const main = get(`${WORK}/audio-source-v1/main-sprite-86.mp3`);
  const coach = get(`${WORK}/audio-source-v1/coach-sprite-76.mp3`);
  const stateMachine = get('packages/demos/src/alg-l12-p012-state.ts');
  const schedule = get('packages/demos/src/alg-l12-p012-audio-schedule.ts');
  const graphics = get(`${WORK}/graphics-source-v1/source-drawings.js`);
  const typography = get(NATIVE_RUNTIME);
  const typographyMetadata = get(`${WORK}/typography-v1/runtime-meta.json`);
  demand(typography.bytes === P012_ADMISSION_RUNTIME.bytes &&
    typography.sha256 === P012_ADMISSION_RUNTIME.sha256, 'frozen typography runtime identity');
  const entry = {key: ID, module: `./modules/${ID}`, maturity: 'private-current-js',
    complexityLane: 'behavior-heavy', artifacts: {module, timeline, runtime: P012_ADMISSION_RUNTIME}};
  const packet = {
    schemaVersion: 1, calibrationId: CALIBRATION,
    sourceRoot: P012_ADMISSION_SOURCE_ROOT, scope: 'private-engineering', deploymentScope: 'local-only',
    predecessor: P012_ADMISSION_PREDECESSOR,
    source: P012_ADMISSION_SOURCE, sourceXml: P012_ADMISSION_XML,
    optionalSpanishAudio: {source: P012_ADMISSION_SA, automaticLocalePlayback: false,
      spokenLanguageVerified: false, listeningAccepted: false},
    selectedPages: [{animationId: ID, placementId: ID, assetId: `swf-${SOURCE_SHA}`,
      stableLessonKey: 'shared-alg001-l12', sourceSha256: SOURCE_SHA,
      moduleCode: 'ALG001', lessonNumber: 12, globalPageOrdinal: 12,
      sectionCode: 'VB', sectionPageOrdinal: 6, complexityLane: 'behavior-heavy',
      implementationLane: 'compiler-assisted-hybrid-maintained-state-machine',
      runtime: {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6,
        frameDomain: 'sprite-86', frameCount: 119, livePlaybackEndFrame: 119, fps: 12,
        language: 'fixed-en', scenario: 'ordered-pairs-interaction', seed: '0', renderScale: 2,
        canvas: {width: 1600, height: 1200}, canvasRenderer: {...P012_ADMISSION_RUNTIME,
          url: `/flash-assets/g678-local/${ID}/typography.js?sha256=${P012_ADMISSION_RUNTIME.sha256}`}},
      runtimeEvidenceBoundary: {runtimeKind: 'source-script-bound-product-behavior-current-js-candidate',
        actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
        audioAcceptance: 'not-established',
        replaySemantics: 'product-complete-interaction-reset-original-runtime-parity-not-established',
        productBehavior: 'maintained-javascript-state-machine-implemented',
        productVisualBehaviorComposite: 'not-established'}}],
    entry,
    interaction: {stateMachine, directions: P012_ADMISSION_DIRECTIONS,
      coachBranches: P012_ADMISSION_COACH, coordinateLimit: 10, pixelsPerCoordinate: 14,
      pixelsPerTick: 2, popupClosePolicy: 'explicit-modern-cancel',
      unresolvedSourceCalls: ['enableButton'], rotationNormalizationAccepted: false},
    audio: {main, coach, schedule, sampleRate: 22_050, channels: 1,
      mainDecodedSamples: 164_736, coachDecodedSamples: 96_768,
      mainTerminalFrame: 119, coachPolicy: 'explicit-rejection-branch',
      synchronizationAccepted: false, listeningAccepted: false},
    visual: {graphics, typography, typographyMetadata},
    glossary: {sourceKeyAttribute: 'Coordinate', sourceButtonId: 53,
      existingEntryOnly: true, closePolicy: 'stay-paused'},
    integrity: {scope: 'P012-source-and-maintained-implementation', completeTransitiveClosure: false,
      qualification: 'P012 source/owned implementation and generation files are pinned here; shared My Lesson contracts are independently pinned by the admission host version.',
      files: [...pins.values()].sort((a,b) => a.path.localeCompare(b.path))},
    acceptanceEffects: Object.fromEntries(P012_ADMISSION_ACCEPTANCE_KEYS.map(key => [key, false])),
    productCalibrationPassed: false, scaleOutAuthorized: false,
  };
  return {packet, entry};
}

/** Read-only, current physical inputs. Outputs are calculated but never
 * created here; even a dry run fails closed on source or host drift. */
export function buildP012AdmissionPlan({root = ROOT,
  sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT} = {}) {
  physicalSource(root, sourceRoot);
  const hostPin = currentHost(root);
  const transaction = readRegistryTransaction(root);
  demand(!transaction.registry.calibrations.some(item => item.calibrationId === CALIBRATION),
    'P012 not already registered');
  const inputPaths = pageInputPaths(root);
  const pins = new Map(inputPaths.map(relative => [relative, pinFile(root, relative)]));
  assert.deepStrictEqual(pins.get(P012_ADMISSION_PREDECESSOR.freezeManifest.path),
    P012_ADMISSION_PREDECESSOR.freezeManifest, 'exact P010 predecessor freeze');
  const {packet, entry} = packetFor(pins);
  const freezeBytes = json(packet);
  const freezePin = {path: FREEZE, bytes: freezeBytes.length, sha256: sha(freezeBytes)};
  const fragment = {calibrationId: CALIBRATION, deploymentScope: 'local-only',
    freezeManifest: FREEZE, freezeManifestBytes: freezePin.bytes,
    freezeManifestSha256: freezePin.sha256, entries: [entry]};
  validateP012AdmissionSemantics(packet, fragment);
  const fragmentBytes = json(fragment);
  const nativeBytes = readPin(root, packet.visual.typography);
  const output = [
    {path: PREPARED_RUNTIME, bytes: nativeBytes},
    {path: FREEZE, bytes: freezeBytes},
    {path: FRAGMENT, bytes: fragmentBytes},
  ];
  const external = [P012_ADMISSION_SOURCE, P012_ADMISSION_XML, P012_ADMISSION_SA]
    .map(pin => ({root: sourceRoot, pin}));
  return {packet, fragment, hostPin, transaction, output, freezePin, external,
    inputCount: inputPaths.length, candidatePath: CANDIDATE};
}

function exclusiveWrite(root, relative, bytes) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, bytes, {flag: 'wx'});
  assert.deepStrictEqual(pinFile(root, relative), {path: relative, bytes: bytes.length, sha256: sha(bytes)},
    `read back ${relative}`);
}

export function prepareP012Admission(plan, root = ROOT) {
  demand([CANDIDATE, ...plan.output.map(item => item.path)]
    .every(relative => !fs.existsSync(path.join(root, relative))), 'all immutable outputs absent');
  for (const item of plan.output) exclusiveWrite(root, item.path, item.bytes);
  const result = prepareAdmissionCandidate({root, output: CANDIDATE, animationId: ID,
    packet: {...plan.packet, freezeManifest: plan.freezePin},
    registration: plan.fragment, implementationFiles: [], external: plan.external,
    hostPin: plan.hostPin, transaction: plan.transaction,
    validateSemantics: validateP012AdmissionSemantics});
  return {status: 'P012_ADMISSION_CANDIDATE_PREPARED_NOT_REGISTERED',
    candidate: result.proof, outputs: plan.output.map(item => pinFile(root, item.path)),
    registrationEffect: 'none', acceptanceEffect: 'none'};
}

export function checkP012Admission(plan, root = ROOT) {
  for (const item of plan.output) demand(readPin(root, {path: item.path,
    bytes: item.bytes.length, sha256: sha(item.bytes)}).equals(item.bytes),
  `current output ${item.path}`);
  const candidate = readJsonPin(root, pinFile(root, CANDIDATE));
  demand(candidate.schemaVersion === 1 && candidate.kind === 'g678-page-proof-v1' &&
    candidate.animationId === ID, 'candidate proof identity');
  const projected = {...plan.transaction, registry: {...plan.transaction.registry,
    calibrations: [...plan.transaction.registry.calibrations, plan.fragment]}};
  const host = verifyHostVersion(root, plan.hostPin);
  validateP012AdmissionSemantics(readPageProof(root, pinFile(root, CANDIDATE), host, projected), plan.fragment);
  return {status: 'P012_ADMISSION_CANDIDATE_CHECKED_NOT_REGISTERED',
    candidate: pinFile(root, CANDIDATE), registrationEffect: 'none', acceptanceEffect: 'none'};
}

export function main(argv = process.argv.slice(2)) {
  demand(argv.length === 1 && ['--dry-run', '--check', '--prepare'].includes(argv[0]),
    'use --dry-run, --check, or --prepare');
  const plan = buildP012AdmissionPlan();
  const result = argv[0] === '--prepare' ? prepareP012Admission(plan) :
    argv[0] === '--check' ? checkP012Admission(plan) :
    {status: 'P012_ADMISSION_INPUTS_VERIFIED_NOT_WRITTEN',
      inputCount: plan.inputCount, outputPins: plan.output.map(item =>
        ({path: item.path, bytes: item.bytes.length, sha256: sha(item.bytes)})),
      candidatePath: plan.candidatePath, registrationEffect: 'none', acceptanceEffect: 'none'};
  process.stdout.write(JSON.stringify(result) + '\n');
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {main();} catch (error) {process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1;}
}
