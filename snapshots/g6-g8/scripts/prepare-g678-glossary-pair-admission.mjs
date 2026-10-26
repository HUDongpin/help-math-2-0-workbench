#!/usr/bin/env node
/** P013 first-family admission preparation. A real --prepare writes a new
 * immutable page candidate only; registry, host, activation and prior proofs
 * remain separate transactions. P015 is deliberately outside this producer. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile, readJsonPin, readPageProof, readPin, readRegistryTransaction,
  uniquePins, verifyHostVersion} from '../lib/g678-admission-proof.mjs';
import {prepareAdmissionCandidate} from './lib/g678-admission-candidate.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {PAIR_ACCEPTANCE_KEYS, PAIR_ADMISSION_CALIBRATION, PAIR_ADMISSION_ID,
  PAIR_KEYTERMS, PAIR_KEYTERM_ROOT, PAIR_MAIN_AUDIO, PAIR_NATIVE_RUNTIME, PAIR_OUTPUT, PAIR_RUNTIME,
  PAIR_SOURCE, PAIR_SOURCE_ROOT, PAIR_SPANISH_AUDIO, PAIR_XML,
  projectPairSource, validateGlossaryPairAdmissionSemantics,
} from '../lib/g678-glossary-pair-admission-semantics.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = PAIR_ADMISSION_ID, CALIBRATION = PAIR_ADMISSION_CALIBRATION;
const FREEZE = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const FRAGMENT = `catalog/product-bridge-calibrations/${CALIBRATION}.fragment.json`;
const CANDIDATE = `work/g678-workflow/candidates/${ID}-v2.json`;
const SOURCE_INVENTORY = `${PAIR_OUTPUT}/source-inputs.json`;
const RESOURCE_INVENTORY = `${PAIR_OUTPUT}/host-resources-v1.json`;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const demand = (value, reason) => assert(value, `G678_PAIR_PREPARE: ${reason}`);

function physicalRoot(root, selected, expected) {
  demand(selected === expected && fs.realpathSync(selected) === selected &&
    fs.lstatSync(selected).isDirectory() && !fs.lstatSync(selected).isSymbolicLink(),
  `physical authorized root: ${expected}`);
  demand(fs.realpathSync(root) === root && fs.lstatSync(root).isDirectory(), 'physical worktree');
}

function activeHost(root) {
  const activation = fs.readFileSync(path.join(root, 'apps/web/lib/g678-admission-activation.ts'), 'utf8');
  const match = activation.match(/export const G678_ADMISSION_INDEX = (\{[\s\S]*?\}) as const;/);
  demand(match, 'current activation pin');
  const index = readJsonPin(root, JSON.parse(match[1]));
  demand(index.kind === 'g678-admission-index-v1' &&
    !index.pages.some(page => page.animationId === ID), 'P013 absent from active index');
  verifyHostVersion(root, index.host);
  return index.host;
}

function pageInputPaths(sourceFacts) {
  const own = [
    'lib/g678-glossary-pair-admission-semantics.mjs',
    'lib/g678-glossary-pair-admission-semantics.test.mjs',
    'scripts/prepare-g678-glossary-pair-admission.mjs',
    'scripts/prepare-g678-glossary-pair-admission.test.mjs',
    `packages/demos/src/modules/${ID}.tsx`,
    `packages/demos/src/timelines/${ID}.ts`,
    'apps/web/lib/g678-glossary-pair-admission.server.ts',
    `migrations/${ID}/audit/capability-support-2026-09-27.json`,
    `${PAIR_OUTPUT}/p013/text-catalog.json`,
    `${PAIR_OUTPUT}/p013/source.json`,
    `${PAIR_OUTPUT}/candidates/p013/adapter-spec.json`,
    `${PAIR_OUTPUT}/candidates/p013/source-canvas-receipt.json`,
    `${PAIR_OUTPUT}/candidates/p013/source-structure.json`,
    `${PAIR_OUTPUT}/candidates/p013/source-audio-structure.json`,
    `${PAIR_OUTPUT}/candidates/p013/canvas-renderer.js`,
    `${PAIR_OUTPUT}/native-candidates/p013/runtime-meta.json`,
    PAIR_NATIVE_RUNTIME.path,
    `${PAIR_OUTPUT}/native-text/p013-suppression-manifest.json`,
    PAIR_MAIN_AUDIO.path,
    ...sourceFacts.sourcePins.slice(1).map(item => item.path),
  ];
  demand(own.every(item => !item.includes('/p015/') && !item.includes('registry.') &&
    item !== SOURCE_INVENTORY && item !== RESOURCE_INVENTORY), 'page-owned closure');
  return [...new Set(own)].sort();
}

function validateCurrentExtractedInputs(root, sourceFacts, pins) {
  for (const item of sourceFacts.sourcePins.slice(1)) {
    assert.deepStrictEqual(pins.get(item.path), item, `P013 extracted source ${item.path}`);
  }
  const metadata = JSON.parse(readPin(root, pins.get(`${PAIR_OUTPUT}/native-candidates/p013/runtime-meta.json`)).toString());
  demand(metadata.schemaVersion === 1 && metadata.animationId === ID &&
    metadata.sourceSwfSha256 === PAIR_SOURCE.sha256 && metadata.frameDomain === 'sprite-63' &&
    metadata.rootFrame === 6 && metadata.frameCount === 372 && metadata.renderScale === 2 &&
    metadata.requiredCanvas.width === 1600 && metadata.requiredCanvas.height === 1200 &&
    metadata.runtimeSha256 === PAIR_NATIVE_RUNTIME.sha256 && metadata.runtimeBytes === PAIR_NATIVE_RUNTIME.bytes &&
    metadata.nativeTextSuppressionApplied === true && metadata.nativeTextReplacementRequired === true &&
    metadata.registered === false && metadata.audioAccepted === false &&
    metadata.originalRuntimeAccepted === false && metadata.fidelityAccepted === false,
  'native runtime provenance and acceptance boundary');
  const audio = JSON.parse(readPin(root, pins.get(`${PAIR_OUTPUT}/candidates/p013/source-audio-structure.json`)).toString());
  demand(audio.schemaVersion === 1 && audio.animationId === ID &&
    audio.sourceSwfSha256 === PAIR_SOURCE.sha256 && audio.frameDomain === 'sprite-63' &&
    audio.structure.latencySeek === 1673 && audio.structure.firstFrame === 2 &&
    audio.structure.lastFrame === 365 && audio.structure.blockCount === 364 &&
    JSON.stringify(audio.structure.emptyFrames) === '[3,365]' &&
    JSON.stringify(audio.structure.negativeSeekBlocks) === '[[365,-2071]]' &&
    audio.sourceAlignmentAccepted === false && audio.listeningAccepted === false,
  'P013 signed-seek audit; no sync or listening acceptance');
  return {metadata, audio};
}

export function buildPairAdmissionPacket({sourceFacts, pins, audit}) {
  const get = relative => {const value = pins.get(relative); demand(value, `page input ${relative}`); return value;};
  const module = get(`packages/demos/src/modules/${ID}.tsx`);
  const timeline = get(`packages/demos/src/timelines/${ID}.ts`);
  const entry = {key: ID, module: `./modules/${ID}`, maturity: 'private-current-js',
    complexityLane: 'interactive-understood', artifacts: {module, timeline, runtime: PAIR_RUNTIME}};
  const packet = {
    schemaVersion: 1, calibrationId: CALIBRATION, sourceRoot: PAIR_SOURCE_ROOT,
    scope: 'private-engineering', deploymentScope: 'local-only',
    source: PAIR_SOURCE, sourceXml: PAIR_XML,
    optionalSpanishAudio: {source: PAIR_SPANISH_AUDIO, automaticLocalePlayback: false,
      spokenLanguageVerified: false, listeningAccepted: false},
    // This is the P013-only projection; the mutable pair inventories are not
    // page-proof inputs and a later P015 investigation cannot rewrite this row.
    sourceFacts,
    selectedPages: [{animationId: ID, placementId: ID, assetId: `swf-${PAIR_SOURCE.sha256}`,
      stableLessonKey: 'shared-alg001-l12', sourceSha256: PAIR_SOURCE.sha256,
      moduleCode: 'ALG001', lessonNumber: 12, globalPageOrdinal: 13,
      sectionCode: 'VB', sectionPageOrdinal: 7, complexityLane: 'interactive-understood',
      implementationLane: 'compiler-assisted-hybrid-maintained-glossary-adapter',
      runtime: {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6,
        frameDomain: 'sprite-63', frameCount: 372, livePlaybackEndFrame: 372,
        fps: 12, language: 'fixed-en', scenario: 'source-static-frame', seed: '0',
        renderScale: 2, canvas: {width: 1600, height: 1200},
        canvasRenderer: {...PAIR_RUNTIME,
          url: `/flash-assets/g678-local/${ID}/typography.js?sha256=${PAIR_NATIVE_RUNTIME.sha256}`}},
      runtimeEvidenceBoundary: {runtimeKind: 'source-structure-bound-modern-current-js-candidate',
        actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
        audioAcceptance: 'not-established',
        replaySemantics: 'modern-full-frame-terminal-hold-original-runtime-parity-not-established',
        productBehavior: 'maintained-glossary-pause-adapter-implemented',
        productVisualBehaviorComposite: 'not-established'}}],
    entry,
    visual: {runtime: PAIR_RUNTIME, nativeRuntime: PAIR_NATIVE_RUNTIME,
      metadata: get(`${PAIR_OUTPUT}/native-candidates/p013/runtime-meta.json`),
      sourceCanvasSha256: audit.metadata.sourceCanvas.sha256},
    audio: {main: PAIR_MAIN_AUDIO,
      structure: get(`${PAIR_OUTPUT}/candidates/p013/source-audio-structure.json`),
      structureFacts: {firstFrame: 2, lastFrame: 365, blockCount: 364,
        emptyFrames: [3,365], negativeSeekBlocks: [[365,-2071]],
        sourceAlignmentAccepted: false, listeningAccepted: false}},
    glossary: {sourceButtonCount: 4, stopPath: 'animation_mc.animation',
      closePolicy: 'remain-paused', additionalGlobalReadParity: 'not-applicable'},
    integrity: {scope: 'P013-own-source-and-implementation', completeTransitiveClosure: false,
      qualification: 'P013 extracted source, native output, audio audit, wrapper and timeline are pinned here; shared implementation and My Lesson host are independently pinned by the host version.',
      files: uniquePins([...pins.values(), PAIR_RUNTIME])},
    acceptanceEffects: Object.fromEntries(PAIR_ACCEPTANCE_KEYS.map(key => [key, false])),
    productCalibrationPassed: false, scaleOutAuthorized: false,
  };
  return {packet, entry};
}

/** Read-only preflight. It intentionally requires the current reviewed host
 * version, all real source bytes, and current page artifacts before outputs. */
export function buildPairAdmissionPlan({root = ROOT,
  sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT,
  keytermRoot = PAIR_KEYTERM_ROOT} = {}) {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV,
    'local engineering only');
  physicalRoot(root, sourceRoot, PAIR_SOURCE_ROOT);
  physicalRoot(root, keytermRoot, PAIR_KEYTERM_ROOT);
  for (const item of [PAIR_SOURCE, PAIR_XML, PAIR_SPANISH_AUDIO])
    assert.deepStrictEqual(pinFile(sourceRoot, item.path), item, `canonical source ${item.path}`);
  for (const item of PAIR_KEYTERMS)
    assert.deepStrictEqual(pinFile(keytermRoot, item.path), item, `bilingual key term ${item.path}`);
  const sourceInputs = readJsonPin(root, pinFile(root, SOURCE_INVENTORY));
  const hostResources = readJsonPin(root, pinFile(root, RESOURCE_INVENTORY));
  const {page: sourceFacts} = projectPairSource(sourceInputs, hostResources);
  const hostPin = activeHost(root), host = verifyHostVersion(root, hostPin);
  const transaction = readRegistryTransaction(root);
  demand(!transaction.registry.calibrations.some(item => item.calibrationId === CALIBRATION),
    'new P013 calibration only');
  const pins = new Map(pageInputPaths(sourceFacts).map(relative => [relative, pinFile(root, relative)]));
  for (const relative of [
    `packages/demos/src/modules/${ID}.tsx`, `packages/demos/src/timelines/${ID}.ts`,
    `${PAIR_OUTPUT}/native-candidates/p013/canvas-renderer.js`, PAIR_MAIN_AUDIO.path,
  ]) demand(!host.files.some(item => item.path === relative), `page input stays outside host: ${relative}`);
  assert.deepStrictEqual(pins.get(PAIR_NATIVE_RUNTIME.path), PAIR_NATIVE_RUNTIME, 'reviewed native runtime bytes');
  assert.deepStrictEqual(pins.get(PAIR_MAIN_AUDIO.path), PAIR_MAIN_AUDIO, 'reviewed embedded stream bytes');
  const nativeBytes = readPin(root, PAIR_NATIVE_RUNTIME);
  demand(nativeBytes.length === PAIR_RUNTIME.bytes && sha256(nativeBytes) === PAIR_RUNTIME.sha256,
    'canonical runtime copy is byte-identical to reviewed native asset');
  if (fs.existsSync(path.join(root, PAIR_RUNTIME.path)))
    assert.deepStrictEqual(pinFile(root, PAIR_RUNTIME.path), PAIR_RUNTIME,
      'pre-existing canonical runtime must be identical');
  const audit = validateCurrentExtractedInputs(root, sourceFacts, pins);
  const {packet, entry} = buildPairAdmissionPacket({sourceFacts, pins, audit});
  const frozenRuntime = packet.selectedPages[0].runtime.canvasRenderer;
  assert.deepStrictEqual({path:frozenRuntime.path,bytes:frozenRuntime.bytes,sha256:frozenRuntime.sha256},
    entry.artifacts.runtime, 'dispatch generator requires freeze and registration runtime identity');
  const freezeBytes = json(packet);
  const freezePin = {path: FREEZE, bytes: freezeBytes.length, sha256: sha256(freezeBytes)};
  const fragment = {calibrationId: CALIBRATION, deploymentScope: 'local-only',
    freezeManifest: FREEZE, freezeManifestBytes: freezePin.bytes,
    freezeManifestSha256: freezePin.sha256, entries: [entry]};
  const projectedRegistry = upsertPrivateCurrentJsCalibration(transaction.registry, fragment);
  demand(projectedRegistry.calibrations.some(item => item.calibrationId === CALIBRATION &&
    JSON.stringify(item) === JSON.stringify(fragment)),
  'real registry validator accepts exact canonical artifact paths and fragment');
  validateGlossaryPairAdmissionSemantics({...packet, freezeManifest: freezePin}, fragment);
  const external = [
    ...[PAIR_SOURCE, PAIR_XML, PAIR_SPANISH_AUDIO].map(pin => ({root: sourceRoot, pin})),
    ...PAIR_KEYTERMS.map(pin => ({root: keytermRoot, pin})),
  ];
  return {packet, fragment, hostPin, transaction, freezePin, external,
    outputs: [{path: PAIR_RUNTIME.path, bytes: nativeBytes},
      {path: FREEZE, bytes: freezeBytes}, {path: FRAGMENT, bytes: json(fragment)}],
    inputCount: pins.size, candidatePath: CANDIDATE};
}

function exclusiveWrite(root, relative, bytes) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, bytes, {flag: 'wx'});
  assert.deepStrictEqual(pinFile(root, relative),
    {path: relative, bytes: bytes.length, sha256: sha256(bytes)}, `read-back ${relative}`);
}

export function preparePairAdmission(plan, root = ROOT) {
  demand([CANDIDATE, ...plan.outputs.map(item => item.path)]
    .every(relative => !fs.existsSync(path.join(root, relative))), 'immutable outputs absent');
  for (const item of plan.outputs) exclusiveWrite(root, item.path, item.bytes);
  const result = prepareAdmissionCandidate({root, output: CANDIDATE,
    animationId: ID, packet: {...plan.packet, freezeManifest: plan.freezePin},
    registration: plan.fragment, implementationFiles: [], external: plan.external,
    hostPin: plan.hostPin, transaction: plan.transaction,
    validateSemantics: validateGlossaryPairAdmissionSemantics});
  return {status: 'P013_PAIR_CANDIDATE_PREPARED_NOT_REGISTERED', candidate: result.proof,
    outputs: plan.outputs.map(item => pinFile(root, item.path)),
    registrationEffect: 'none', acceptanceEffect: 'none'};
}

export function checkPairAdmission(plan, root = ROOT) {
  for (const item of plan.outputs)
    demand(readPin(root, {path: item.path, bytes: item.bytes.length,
      sha256: sha256(item.bytes)}).equals(item.bytes), `current immutable ${item.path}`);
  const projected = {...plan.transaction, registry: {...plan.transaction.registry,
    calibrations: [...plan.transaction.registry.calibrations, plan.fragment]}};
  const packet = readPageProof(root, pinFile(root, CANDIDATE),
    verifyHostVersion(root, plan.hostPin), projected);
  validateGlossaryPairAdmissionSemantics(packet, plan.fragment);
  return {status: 'P013_PAIR_CANDIDATE_CHECKED_NOT_REGISTERED',
    candidate: pinFile(root, CANDIDATE), registrationEffect: 'none', acceptanceEffect: 'none'};
}

export function main(argv = process.argv.slice(2)) {
  demand(argv.length === 1 && ['--dry-run','--prepare','--check'].includes(argv[0]),
    'use --dry-run, --prepare or --check');
  const plan = buildPairAdmissionPlan();
  const result = argv[0] === '--prepare' ? preparePairAdmission(plan) :
    argv[0] === '--check' ? checkPairAdmission(plan) :
    {status: 'P013_PAIR_INPUTS_VERIFIED_NOT_WRITTEN', inputCount: plan.inputCount,
      outputPins: plan.outputs.map(item => ({path: item.path, bytes: item.bytes.length,
        sha256: sha256(item.bytes)})), candidatePath: plan.candidatePath,
      registrationEffect: 'none', acceptanceEffect: 'none'};
  process.stdout.write(JSON.stringify(result) + '\n');
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {main();} catch (error) {process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1;}
}
