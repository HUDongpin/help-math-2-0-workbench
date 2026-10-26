import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  createAdmissionPlan, prepareAdmission, collectAdmissionInputs, loadTypographyProof,
  validateFinalTimeline, validateCanonicalModule, validateAudioSchedule, stableFile,
  validateOptionalSpanishSource, validateSpanishAudioSource, P010_OPTIONAL_SA_PATHS as SA,
  P010_OPTIONAL_SA_PINS, readerRequiredFrozenPaths, validateFrozenReaderCoverage,
  P010_MUTABLE_INTEGRATION_PATHS as MUTABLE, digest, parseArguments,
  P010_ID as ID, P010_ADMISSION_PATHS as PATHS, P010_TYPOGRAPHY_PATHS as TYPO,
  P010_EXCLUDED_FREEZE_PATHS as EXCLUDED, P010_NATIVE_TYPOGRAPHY_PATHS as NATIVE,
  P010_PREDECESSOR, P010_GLOSSARY_KEYS, REQUIRED_WORKSPACE_PATHS as REQUIRED,
  PHYSICAL_SOURCE_PINS, SOURCE_ROOT, SOURCE_CATALOG_SHA, ACCEPTANCE_KEYS,
} from './prepare-g678-alg-l12-p010-current-js-v1.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clone = value => JSON.parse(JSON.stringify(value));
function put(map, relative, value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  const file = {bytes, pin: {path: relative, bytes: bytes.length, sha256: digest(bytes)}};
  map.set(relative, file); return file;
}
const actual = relative => stableFile(ROOT, relative);

/** Actual production collector inputs only; never manufacture missing wiring.
 * The copied technical records are rebound to real current bytes solely inside
 * this in-memory validator fixture. They do not attest new code or authorize
 * actual admission, browser evidence, registration, or acceptance. */
function fixture() {
  const files = collectAdmissionInputs(ROOT), proofFiles = new Map();
  const binding = JSON.parse(actual(TYPO.binding).bytes), check = JSON.parse(actual(TYPO.check).bytes);
  for (const relative of new Set([
    ...binding.implementation.files.map(pin => pin.path), ...files.keys(), ...MUTABLE,
  ])) proofFiles.set(relative, actual(relative));
  for (const reference of check.artifacts) proofFiles.set(reference.path, actual(reference.path));
  const implementation = [...new Set([...binding.implementation.files.map(pin => pin.path), ...files.keys(), ...MUTABLE])]
    .sort().map(relative => proofFiles.get(relative).pin);
  const receipt = JSON.parse(proofFiles.get(check.receipt.path).bytes);
  receipt.checkedImplementationFiles = implementation;
  receipt.scope = 'Isolated actual-input validator fixture; no actual technical, admission or acceptance effect.';
  const receiptFile = put(proofFiles, check.receipt.path, receipt);
  binding.implementation.files = implementation; check.checkedImplementationFiles = implementation;
  binding.technicalFinalization.receipt = receiptFile.pin; binding.sourceRiskEvidence.technicalReceipt = receiptFile.pin;
  check.receipt = receiptFile.pin;
  check.artifacts = check.artifacts.map(pin => pin.path === receiptFile.pin.path ? receiptFile.pin : pin);
  const bindingFile = put(proofFiles, TYPO.binding, binding);
  check.bindingSha256 = bindingFile.pin.sha256; put(proofFiles, TYPO.check, check);
  return {files, proof: {files: proofFiles, sourceCatalog: JSON.parse(files.get(PATHS.sourceCatalog).bytes),
    sourceCatalogContentSha256: SOURCE_CATALOG_SHA}};
}
const plan = value => createAdmissionPlan(value.files, PHYSICAL_SOURCE_PINS, value.proof);
function changeCheck(value, mutation) {
  const check = JSON.parse(value.proof.files.get(TYPO.check).bytes); mutation(check); put(value.proof.files, TYPO.check, check);
}
function changeBinding(value, mutation) {
  const binding = JSON.parse(value.proof.files.get(TYPO.binding).bytes); mutation(binding);
  const file = put(value.proof.files, TYPO.binding, binding);
  changeCheck(value, check => {check.bindingSha256 = file.pin.sha256;});
}

test('actual immutable optional SA proof enforces decode-only and conditional terminal semantics', () => {
  const files = new Map(Object.values(P010_OPTIONAL_SA_PINS).map(pin => [pin.path, actual(pin.path)]));
  assert.equal(validateOptionalSpanishSource(files), true);
  for (const [relative, mutation, message] of [
    [SA.analysis, data => {data.audit.decodes.find(row => row.name === 'sidecar').length = 1116288;}, /native sidecar/u],
    [SA.analysis, data => {data.sourceNodeStarts = 1;}, /native sidecar/u],
    [SA.analysis, data => {data.actualBrowserMeasured = false;}, /native sidecar/u],
    [SA.receipt, data => {data.sourceTransport.completionAtFrame465RequestsMainPlay = true;}, /conditional P010/u],
    [SA.receipt, data => {data.sourceTransport.completionAtFrame464WithQuizFalseRequestsMainPlay = false;}, /conditional P010/u],
    [SA.receipt, data => {data.staticConditionalApplication.actualFlagsObserved = true;}, /conditional P010/u],
    [SA.receipt, data => {data.acceptanceEffects.audioAccepted = true;}, /conditional P010/u],
  ]) {
    // Counterfactual semantic unit input after the pin gate: preserve its
    // declaration solely to exercise the deeper predicate. This is never a
    // stableFile result and cannot pass the physical production reader.
    const counterfactual = new Map(files), source = files.get(relative), data = JSON.parse(source.bytes);
    mutation(data);
    counterfactual.set(relative, {pin: source.pin, bytes: Buffer.from(JSON.stringify(data))});
    assert.throws(() => validateOptionalSpanishSource(counterfactual), message);
  }
});

test('actual reader static seeds are unique producer requirements including both typography preparation inputs', () => {
  const paths = readerRequiredFrozenPaths(actual(PATHS.reader).bytes.toString());
  assert.equal(paths.length, new Set(paths).size);
  for (const relative of paths) assert(REQUIRED.includes(relative), relative);
  assert(paths.includes('scripts/prepare-g678-alg-l12-p010-typography-binding.mts'));
  assert(paths.includes('scripts/prepare-g678-alg-l12-p010-typography-binding.test.mts'));
  assert(!paths.includes(TYPO.binding)); assert(!paths.includes(TYPO.check));
  assert(!paths.includes(MUTABLE[0]));
});

test('actual collector has every producer input and all independently declared reader seeds', () => {
  const files = collectAdmissionInputs(ROOT), reader = actual(PATHS.reader).bytes.toString();
  for (const relative of REQUIRED) assert(files.has(relative), relative);
  for (const relative of [...EXCLUDED, ...MUTABLE]) assert(!files.has(relative), relative);
  for (const relative of readerRequiredFrozenPaths(reader)) assert(files.has(relative), relative);
  const integration = JSON.parse(files.get(TYPO.integration).bytes);
  for (const pin of integration.sharedFiles) assert.deepEqual(files.get(pin.path), stableFile(ROOT, pin.path, pin));
  for (const [relative, file] of files) assert.deepEqual(file, actual(relative));
});

test('pure P010 successor preserves P009 and adds exactly one private source-bound registration', () => {
  const value = fixture(), first = plan(value), second = plan(value), {packet} = first;
  assert.deepEqual(first.outputs, second.outputs);
  assert.deepEqual(first.outputs.map(output => output.path), [PATHS.preparedRuntime, PATHS.freeze, PATHS.fragment]);
  assert.deepEqual(packet.predecessor, P010_PREDECESSOR); assert.equal(packet.supersedes, undefined);
  const page = packet.selectedPages[0];
  assert.equal(page.globalPageOrdinal, 10); assert.equal(page.sectionCode, 'VB'); assert.equal(page.sectionPageOrdinal, 4);
  assert.equal(page.runtime.frameDomain, 'sprite-96'); assert.equal(page.runtime.frameCount, 465);
  assert.equal(page.runtime.rootFrameCount, 10); assert.equal(page.runtime.rootBeginFrame, 6);
  assert.equal(page.runtime.renderScale, 2); assert.deepEqual(page.runtime.canvas, {width: 1600, height: 1200});
  assert.deepEqual(packet.nativeTypography.runtime, value.files.get(PATHS.runtime).pin);
  assert.deepEqual(packet.entry.artifacts.runtime, {...value.files.get(PATHS.runtime).pin, path: PATHS.preparedRuntime});
  assert(first.outputs[0].bytes.equals(value.files.get(PATHS.runtime).bytes));
  assert.equal(first.fragment.freezeManifestSha256, digest(first.outputs[1].bytes));
  assert.equal(first.fragment.freezeManifestBytes, first.outputs[1].bytes.length);
  const previous = JSON.parse(actual('packages/demos/private-current-js-registry.json').bytes);
  const registry = upsertPrivateCurrentJsCalibration(previous, first.fragment);
  assert.deepEqual(registry.calibrations.filter(c => c.calibrationId !== first.fragment.calibrationId),
    previous.calibrations.filter(c => c.calibrationId !== first.fragment.calibrationId));
  const already = previous.calibrations.flatMap(c => c.entries).some(e => e.key === ID);
  assert.equal(registry.calibrations.flatMap(c => c.entries).length,
    previous.calibrations.flatMap(c => c.entries).length + (already ? 0 : 1));
  assert.equal(registry.calibrations.flatMap(c => c.entries).filter(e => e.key === ID).length, 1);
  assert.deepEqual(actual(P010_PREDECESSOR.freezeManifest.path).pin, P010_PREDECESSOR.freezeManifest);
  assert.equal(packet.preparationState.activationPermitted, true);
  assert.equal(packet.preparationState.postRegistrationTypographyCheckRequired, true);
  assert.deepEqual(Object.keys(packet.acceptanceEffects), [...ACCEPTANCE_KEYS]);
  assert(Object.values(packet.acceptanceEffects).every(value => value === false));
  assert.equal(packet.productCalibrationPassed, false); assert.equal(packet.scaleOutAuthorized, false);
  assert.deepEqual(packet.embeddedAudio.sourceSampleRange, [0, 837504]);
  assert.equal(packet.embeddedAudio.timelineStartSample, 16537.5);
  assert.equal(packet.embeddedAudio.timelineEndSample, 854041.5);
  assert.equal(packet.embeddedAudio.visualTerminalSample, 854437.5);
  assert.equal(packet.embeddedAudio.sourceTerminalStop, false);
  assert.deepEqual(packet.optionalSpanishAudio.sourceHostProof, P010_OPTIONAL_SA_PINS);
  assert.deepEqual(packet.optionalSpanishAudio.nativeAudio, {sampleRate: 48000, numberOfChannels: 1, decodedSamples: 738432});
  assert.equal(packet.optionalSpanishAudio.returnPolicy, 'retained-main-position; modern465terminal-no-auto-replay');
  assert.equal(packet.glossary.buttonCount, 10); assert.equal(packet.glossary.expectedCount, 44);
  assert.deepEqual(packet.glossary.supplementalKeys, ['Geometric figures', 'Position', 'length', 'Width', 'Height']);
});

test('freeze separates mutable proof and output cycles while retaining native/shared admission closure', () => {
  const value = fixture(), check = JSON.parse(value.proof.files.get(TYPO.check).bytes);
  for (const relative of EXCLUDED) put(value.files, relative, 'isolated mutable output');
  for (const reference of check.artifacts) value.files.set(reference.path, value.proof.files.get(reference.path));
  const packet = plan(value).packet, paths = new Set(packet.integrity.files.map(pin => pin.path));
  for (const relative of [...EXCLUDED, ...check.artifacts.map(pin => pin.path)]) assert(!paths.has(relative), relative);
  for (const relative of [PATHS.reader, PATHS.aggregate, PATHS.module, PATHS.timeline,
    'scripts/prepare-g678-alg-l12-p010-typography-binding.mts',
    'scripts/prepare-g678-alg-l12-p010-typography-binding.test.mts']) assert(paths.has(relative), relative);
  for (const relative of Object.values(SA)) assert(paths.has(relative), relative);
  const integration = JSON.parse(value.files.get(TYPO.integration).bytes);
  assert.deepEqual(packet.nativeTypography.criticalFiles.map(pin => pin.path),
    [...new Set([...NATIVE, ...integration.sharedFiles.map(pin => pin.path)])].sort());
  assert.equal(packet.integrity.completeTransitiveClosure, false);
  assert.deepEqual(packet.integrity.mutableBoundaryPaths, MUTABLE);
});

test('reader closure cannot omit typography producer/test or hide a newly required reader input', () => {
  const value = fixture(), packet = plan(value).packet, reader = actual(PATHS.reader).bytes.toString();
  const required = readerRequiredFrozenPaths(reader);
  assert.deepEqual(validateFrozenReaderCoverage(packet, reader), required);
  for (const relative of ['scripts/prepare-g678-alg-l12-p010-typography-binding.mts',
    'scripts/prepare-g678-alg-l12-p010-typography-binding.test.mts']) {
    assert(required.includes(relative));
    const missing = fixture(); missing.files.delete(relative); assert.throws(() => plan(missing), /required dependency/u);
    const omitted = clone(packet); omitted.integrity.files = omitted.integrity.files.filter(pin => pin.path !== relative);
    assert.throws(() => validateFrozenReaderCoverage(omitted, reader), /actual reader-required frozen input/u);
  }
  const expanded = reader.replace("'scripts/prepare-g678-alg-l12-p010-typography-binding.mts',",
    "'scripts/prepare-g678-alg-l12-p010-typography-binding.mts', 'scripts/new-mandatory-reader-input.mts',");
  assert.throws(() => validateFrozenReaderCoverage(packet, expanded), /new-mandatory-reader-input/u);
  const dynamic = reader.replace('export const ALG_L12_P010_ADMISSION_INPUT_PATHS = Object.freeze(',
    'export const ALG_L12_P010_ADMISSION_INPUT_PATHS = collectRuntimeSeeds(');
  assert.throws(() => readerRequiredFrozenPaths(dynamic), /static frozen/u);
});

test('live mutable availability is current technical proof and cannot enter a frozen packet', () => {
  const value = fixture(), packet = plan(value).packet;
  assert(!packet.integrity.files.some(pin => MUTABLE.includes(pin.path)));
  const pin = JSON.parse(value.proof.files.get(TYPO.binding).bytes).implementation.files.find(pin => pin.path === MUTABLE[0]);
  assert(pin);
  const missing = fixture();
  changeBinding(missing, binding => {binding.implementation.files = binding.implementation.files.filter(pin => pin.path !== MUTABLE[0]);});
  changeCheck(missing, check => {check.checkedImplementationFiles = check.checkedImplementationFiles.filter(pin => pin.path !== MUTABLE[0]);});
  assert.throws(() => plan(missing), /current live mutable integration boundary/u);
  const illegal = clone(packet); illegal.integrity.files.push(pin);
  assert.throws(() => validateFrozenReaderCoverage(illegal, actual(PATHS.reader).bytes.toString()), /live-proof-only/u);
});

test('source roles require 54 exact native blocks without duplicate generation or substituted title', () => {
  const value = fixture(), binding = JSON.parse(value.proof.files.get(TYPO.binding).bytes);
  assert.equal(binding.blocks.length, 54);
  const metadata = JSON.parse(value.files.get(PATHS.metadata).bytes);
  assert.equal(metadata.exactSuppressionInstances.length, 58);
  for (const mutation of [
    b => {b.blocks.pop();}, b => {b.blocks[0].sourceShapeIds = [2];},
    b => {b.blocks[1].instance = clone(b.blocks[2].instance);},
    b => {b.blocks[1].sourceTextIds = ['forged-source-run'];},
    b => {b.blocks[1].instance.path[1].generation += 1;},
  ]) {
    const broken = fixture(); changeBinding(broken, mutation); assert.throws(() => plan(broken));
  }
});

test('optional SA preserves fixed native transport evidence and denies playback or source substitution', () => {
  const value = fixture(); assert.equal(validateOptionalSpanishSource(value.files), true);
  const controller = actual(SA.controller).bytes.toString(); assert(validateSpanishAudioSource(controller));
  for (const text of [controller.replace('sampleRate: 48_000', 'sampleRate: 22_050'),
    controller.replace('decodedSamples: 738_432', 'decodedSamples: 738_431'),
    controller.replace('spanish-audio.mp3', 'source-audio.mp3')]) assert.throws(() => validateSpanishAudioSource(text));
  for (const [relative, mutation] of [
    [SA.analysis, data => {data.audit.decodes.find(row => row.name === 'sidecar').length = 1116288;}],
    [SA.analysis, data => {data.sourceNodeStarts = 1;}],
    [SA.receipt, data => {data.sourceTransport.completionAtFrame465RequestsMainPlay = true;}],
    [SA.receipt, data => {data.staticConditionalApplication.actualFlagsObserved = true;}],
  ]) {
    const changed = fixture(), data = JSON.parse(changed.files.get(relative).bytes); mutation(data);
    put(changed.files, relative, data); assert.throws(() => plan(changed), /exact P010 optional SA source evidence/u);
  }
  const missing = fixture(); missing.files.delete(SA.serverTest); assert.throws(() => plan(missing), /required dependency/u);
  const altered = clone(PHYSICAL_SOURCE_PINS); altered.spanishAudio.sha256 = 'a'.repeat(64);
  assert.throws(() => createAdmissionPlan(value.files, altered, value.proof), /exact physical source/u);
});

test('pending typography, mismatched proof, missing checks and acceptance inflation remain fail-closed', () => {
  assert.throws(() => createAdmissionPlan(fixture().files, PHYSICAL_SOURCE_PINS), /finalized current/u);
  for (const mutation of [b => {b.preparationOnly = true;}, b => {b.implementation.status = 'candidate';},
    b => {b.unresolved = ['pending'];}, b => {b.sourceRiskEvidence.technicalRiskCheckRecorded = false;},
    b => {b.version = 'unreviewed-version';}, b => {b.independentAcceptance.originalRuntimeAccepted = true;},
    b => {delete b.independentAcceptance.audioAccepted; b.independentAcceptance.inventedGate = false;}]) {
    const value = fixture(); changeBinding(value, mutation); assert.throws(() => plan(value));
  }
  for (const mutation of [c => {c.checks.accessibility = 'pending';}, c => {delete c.checks.performance;},
    c => {c.bindingSha256 = 'a'.repeat(64);}, c => {c.ownerAccepted = true;},
    c => {c.languagePolicy.es = 'source';}, c => {c.resolvedSourceRisks.pop();},
    c => {c.checkedImplementationFiles.pop();}, c => {delete c.checkEvidence.lifecycle;},
    c => {c.checkedAt = '2999-01-01T00:00:00Z';}]) {
    const value = fixture(); changeCheck(value, mutation); assert.throws(() => plan(value));
  }
  const changed = fixture(); put(changed.files, NATIVE[0], 'changed native implementation');
  assert.throws(() => plan(changed), /baseline current/u);
  const missing = fixture(), check = JSON.parse(missing.proof.files.get(TYPO.check).bytes);
  missing.proof.files.delete(check.artifacts[0].path); assert.throws(() => plan(missing), /technical artifact/u);
});

test('nested placement, whole native stream, literal glossary keys and immutable P009 are not substitutable', () => {
  const base = fixture(), placement = JSON.parse(base.files.get(PATHS.sourcePlacement).bytes);
  assert.equal(placement.placement.globalOrdinal, 10);
  const glossary = JSON.parse(base.files.get(PATHS.sourceGlossary).bytes);
  assert.deepEqual(glossary.sources[0].records.map(record => record.literalKey), P010_GLOSSARY_KEYS);
  for (const [relative, mutation] of [
    [PATHS.sourcePlacement, data => {data.placement.globalOrdinal = 9;}],
    [PATHS.sourcePlacement, data => {data.oneIndexedOrdinal = 9;}],
    [PATHS.sourceBlocks, data => {data.stream.firstBlockFrame = 2;}],
    [PATHS.sourceBlocks, data => {data.stream.emptyPayloadFrames = [];}],
    [PATHS.sourceGlossary, data => {data.sources[0].records[0].literalKey = 'Other dictionary key';}],
    [PATHS.sourceGlossary, data => {data.explicitCaseCrosswalks = [{from: 'Position', to: 'position'}];}],
  ]) {
    const value = fixture(), data = JSON.parse(value.files.get(relative).bytes); mutation(data); put(value.files, relative, data);
    assert.throws(() => plan(value));
  }
  const changed = fixture(); put(changed.files, P010_PREDECESSOR.freezeManifest.path, '{}');
  assert.throws(() => plan(changed), /exact retained P009 predecessor/u);
});

test('AST validation rejects comment spoofing, duplicate flags, false renderer and unsupported initial latency trim', () => {
  const timeline = actual(PATHS.timeline).bytes.toString(), moduleSource = actual(PATHS.module).bytes.toString();
  const audio = actual('packages/demos/src/alg-l12-p010-audio-schedule.ts').bytes.toString();
  assert(validateFinalTimeline(timeline)); assert(validateCanonicalModule(moduleSource)); assert(validateAudioSchedule(audio));
  const timelineMutations = [
    timeline.replace("mainFrameDomain: 'sprite-96'", "mainFrameDomain: 'root' /* mainFrameDomain: 'sprite-96' */"),
    timeline.replace("registrationAuthority: 'private-current-js-registry',", "registrationAuthority: 'private-current-js-registry', currentJavaScriptRegistered: true,"),
    timeline.replace('audioPlaybackEnabled: true,', 'audioPlaybackEnabled: true, audioPlaybackEnabled: false,'),
  ];
  for (const text of timelineMutations) {assert.notEqual(text, timeline); assert.throws(() => validateFinalTimeline(text));}
  const wrongRenderer = moduleSource.replace('Renderer: P010TypographyRenderer,', 'Renderer: candidate.module.Renderer,');
  assert.notEqual(wrongRenderer, moduleSource); assert.throws(() => validateCanonicalModule(wrongRenderer));
  for (const text of [
    audio.replace('sourceTerminalStop: false,', 'sourceTerminalStop: true, /* sourceTerminalStop: false */'),
    audio.replace('firstAudioFrame: 10,', 'firstAudioFrame: 2,'),
    audio.replace('sourceStartSample: 0,', 'sourceStartSample: 1_673,'),
    audio.replace('initialLatencyTrimApplied: false,', 'initialLatencyTrimApplied: true,'),
    audio.replace('terminalTimelineSample: 854_437.5,', 'terminalTimelineSample: 852_600,'),
  ]) {assert.notEqual(text, audio); assert.throws(() => validateAudioSchedule(text));}
});

test('physical stable reader denies path traversal, symlink, hardlink, forged hash and read race', t => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p010-current-js-stable-')));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  fs.writeFileSync(path.join(root, 'input.txt'), 'isolated bytes'); const original = stableFile(root, 'input.txt');
  assert.throws(() => stableFile(root, '../escape'));
  assert.throws(() => stableFile(root, 'input.txt', {...original.pin, sha256: 'd'.repeat(64)}), /exact file pin/u);
  fs.symlinkSync(path.join(root, 'input.txt'), path.join(root, 'link.txt'));
  assert.throws(() => stableFile(root, 'link.txt'), /physical/u);
  let calls = 0;
  const racing = {...fs, lstatSync: (...args) => {
    const stat = fs.lstatSync(...args); calls++;
    return calls === 2 ? new Proxy(stat, {get: (object, key) => key === 'ctimeNs' ? object.ctimeNs + 1n : Reflect.get(object, key)}) : stat;
  }};
  assert.throws(() => stableFile(root, 'input.txt', undefined, racing), /stable read/u);
  fs.linkSync(path.join(root, 'input.txt'), path.join(root, 'hard.txt'));
  assert.throws(() => stableFile(root, 'input.txt'), /single-link/u);
});

test('read-only CLI and absent physical proof cannot create an active fragment', t => {
  assert.deepEqual(parseArguments(['--dry-run']), {mode: '--dry-run'}); assert.deepEqual(parseArguments(['--check']), {mode: '--check'});
  for (const args of [[], ['--write'], ['--dry-run', '--write'], ['--check', 'other']]) assert.throws(() => parseArguments(args), /read-only/u);
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p010-current-js-missing-proof-')));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  assert.throws(() => prepareAdmission({root, sourceRoot: `${SOURCE_ROOT}/`}), /opt-in/u);
  const inactive = prepareAdmission({root, sourceRoot: SOURCE_ROOT});
  assert.equal(inactive.active, false); assert.equal(inactive.preparationState.activationPermitted, false);
  assert.equal(inactive.status, 'P010_TYPOGRAPHY_FINALIZATION_REQUIRED'); assert(!('plan' in inactive));
  const bytes = fs.readFileSync(path.join(SOURCE_ROOT, PHYSICAL_SOURCE_PINS.source.path));
  assert.throws(() => loadTypographyProof({sourceBytes: Buffer.concat([bytes, Buffer.from('forged')]), root}), /actual physical source/u);
});
