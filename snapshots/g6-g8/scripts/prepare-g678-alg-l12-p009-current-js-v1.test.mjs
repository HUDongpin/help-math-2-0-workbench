import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  createAdmissionPlan, prepareAdmission, loadTypographyProof, validateTypographyAdmission,
  validateFinalTimeline, validateCanonicalModule, validateAudioSchedule, stableFile,
  validateOptionalSpanishSource, validateSpanishAudioSource, P009_OPTIONAL_SA_PATHS as SA, P009_OPTIONAL_SA_PINS,
  digest, parseArguments, P009_ID as ID, P009_ADMISSION_PATHS as PATHS,
  P009_TYPOGRAPHY_PATHS as TYPO, P009_TYPOGRAPHY_CHECKS as CHECKS,
  P009_EXCLUDED_FREEZE_PATHS as EXCLUDED, P009_NATIVE_TYPOGRAPHY_PATHS as NATIVE,
  P009_PREDECESSOR, REQUIRED_WORKSPACE_PATHS as REQUIRED, PHYSICAL_SOURCE_PINS,
  SOURCE_ROOT, SOURCE_CATALOG_SHA, ACCEPTANCE_KEYS,
} from './prepare-g678-alg-l12-p009-current-js-v1.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clone = value => JSON.parse(JSON.stringify(value));
function put(map, relative, value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  const file = {bytes, pin: {path: relative, bytes: bytes.length, sha256: digest(bytes)}};
  map.set(relative, file); return file;
}
function actual(relative) {return stableFile(ROOT, relative);}

/** The pure constructor receives caller-verified buffers. These isolated maps
 * model the separately observed initial technical baseline plus new wiring.
 * Historical pins remain declarations in this fixture; only prepareAdmission
 * can read current real bytes and authorize an active plan. No tests write a
 * real receipt/freeze/registry or treat synthetic wiring as an actual pass. */
function fixture() {
  const files = new Map(), proofFiles = new Map();
  const binding = JSON.parse(actual(TYPO.binding).bytes), check = JSON.parse(actual(TYPO.check).bytes);
  for (const relative of REQUIRED) {
    if (fs.existsSync(path.join(ROOT, relative))) files.set(relative, actual(relative));
    else put(files, relative, `isolated not-yet-delivered wiring fixture: ${relative}`);
  }
  const integration = JSON.parse(files.get(TYPO.integration).bytes);
  for (const reference of integration.sharedFiles) files.set(reference.path, actual(reference.path));
  for (const references of [binding.implementation.files, check.artifacts]) for (const reference of references) {
    const current = actual(reference.path);
    proofFiles.set(reference.path, {bytes: current.bytes, pin: {...reference}});
  }
  proofFiles.set(TYPO.binding, actual(TYPO.binding)); proofFiles.set(TYPO.check, actual(TYPO.check));
  const sourceCatalog = JSON.parse(files.get(PATHS.sourceCatalog).bytes);
  return {files, proof: {files: proofFiles, sourceCatalog, sourceCatalogContentSha256: SOURCE_CATALOG_SHA}};
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

test('pure source-bound freeze/fragment adds one private P009 and preserves every independent pending gate', () => {
  const value = fixture(), first = plan(value), second = plan(value);
  assert.deepEqual(first.outputs, second.outputs);
  assert.deepEqual(first.outputs.map(output => output.path), [PATHS.preparedRuntime, PATHS.freeze, PATHS.fragment]);
  const packet = first.packet, page = packet.selectedPages[0];
  assert.equal(packet.scope, 'private-engineering'); assert.equal(packet.deploymentScope, 'local-only');
  assert.deepEqual(packet.predecessor, P009_PREDECESSOR);
  assert.equal(page.globalPageOrdinal, 9); assert.equal(page.sectionCode, 'VB'); assert.equal(page.sectionPageOrdinal, 3);
  assert.equal(page.runtime.frameDomain, 'sprite-62'); assert.equal(page.runtime.frameCount, 394);
  assert.equal(page.runtime.rootBeginFrame, 6); assert.equal(page.runtime.renderScale, 2);
  assert.deepEqual(page.runtime.canvas, {width: 1600, height: 1200});
  assert.deepEqual(packet.nativeTypography.runtime, value.files.get(PATHS.runtime).pin);
  assert.deepEqual(packet.entry.artifacts.runtime, {...value.files.get(PATHS.runtime).pin, path: PATHS.preparedRuntime});
  assert.deepEqual(packet.selectedPages[0].runtime.canvasRenderer,
    {...packet.entry.artifacts.runtime, url: `/flash-assets/g678-local/${ID}/typography-renderer.js`});
  assert(first.outputs[0].bytes.equals(value.files.get(PATHS.runtime).bytes));
  assert.equal(digest(first.outputs[0].bytes), packet.nativeTypography.runtime.sha256);
  assert.equal(first.fragment.freezeManifestSha256, digest(first.outputs[1].bytes));
  assert.equal(first.fragment.freezeManifestBytes, first.outputs[1].bytes.length);
  const previous = JSON.parse(actual('packages/demos/private-current-js-registry.json').bytes);
  const registry = upsertPrivateCurrentJsCalibration(previous, first.fragment);
  const admitted = registry.calibrations.find(calibration => calibration.calibrationId === first.fragment.calibrationId);
  assert.equal(admitted.entries.length, 1); assert.equal(admitted.entries[0].key, ID);
  assert.equal(admitted.entries[0].maturity, 'private-current-js');
  assert.deepEqual(registry.calibrations.filter(calibration => calibration.calibrationId !== first.fragment.calibrationId),
    previous.calibrations.filter(calibration => calibration.calibrationId !== first.fragment.calibrationId));
  assert.equal(registry.calibrations.flatMap(calibration => calibration.entries).filter(entry => entry.key === ID).length, 1);
  assert.equal(packet.preparationState.activationPermitted, true);
  assert.equal(packet.preparationState.postRegistrationTypographyCheckRequired, true);
  assert.deepEqual(Object.keys(packet.acceptanceEffects), [...ACCEPTANCE_KEYS]);
  assert(Object.values(packet.acceptanceEffects).every(value => value === false));
  assert.equal(packet.productCalibrationPassed, false); assert.equal(packet.scaleOutAuthorized, false);
  assert.equal(packet.excludedAudioSidecar, undefined);
  assert.deepEqual(packet.optionalSpanishAudio.source, PHYSICAL_SOURCE_PINS.spanishAudio);
  assert.deepEqual(packet.optionalSpanishAudio.sourceHostProof, P009_OPTIONAL_SA_PINS);
  assert.deepEqual(packet.optionalSpanishAudio.nativeAudio, {sampleRate: 48000, numberOfChannels: 1, decodedSamples: 1116288});
  assert.equal(packet.optionalSpanishAudio.automaticLocalePlayback, false);
  assert.equal(packet.optionalSpanishAudio.playbackPolicy, 'explicit-only-separate-start-from-zero');
  assert.equal(packet.optionalSpanishAudio.pauseRestartPolicy, 'restart-at-zero');
  assert.equal(packet.optionalSpanishAudio.returnPolicy, 'retained-main-position; modern394terminal-no-auto-replay');
  for (const key of ['originalHostParityAccepted', 'synchronizationAccepted', 'listeningAccepted', 'spokenLanguageVerified'])
    assert.equal(packet.optionalSpanishAudio[key], false, key);
  assert.deepEqual(packet.embeddedAudio.sourceSampleRange, [1673, 721728]);
  assert.equal(packet.embeddedAudio.timelineStartSample, 1837.5); assert.equal(packet.embeddedAudio.visualTerminalSample, 722137.5);
  assert.equal(packet.embeddedAudio.sourceTerminalStop, false);
  assert.deepEqual(packet.glossary.supplementalKeys, ['Pair', 'Locate', 'X-coordinate', 'Y-coordinate']);
  assert.equal(packet.glossary.buttonCount, 8); assert.equal(packet.glossary.expectedCount, 39);
});

test('frozen input inventory has native/shared and maintained wiring, excludes live registry/proof/output cycles', () => {
  const value = fixture();
  for (const relative of EXCLUDED) value.files.set(relative, value.proof.files.get(relative) ?? put(new Map(), relative, 'isolated mutable output'));
  const check = JSON.parse(value.proof.files.get(TYPO.check).bytes);
  for (const reference of check.artifacts) value.files.set(reference.path, value.proof.files.get(reference.path));
  const {packet, outputs} = plan(value), paths = new Set(packet.integrity.files.map(pin => pin.path));
  for (const relative of [...EXCLUDED, ...check.artifacts.map(reference => reference.path)]) assert(!paths.has(relative), relative);
  for (const relative of [PATHS.reader, PATHS.aggregate, PATHS.module, PATHS.timeline,
    'apps/web/lib/learning-lesson-availability.server.ts',
    'packages/demos/src/alg-l12-p009-embedded-audio.ts', 'scripts/prepare-g678-alg-l12-p009-current-js-v1.mjs']) assert(paths.has(relative));
  for (const relative of Object.values(SA)) assert(paths.has(relative), relative);
  const integration = JSON.parse(value.files.get(TYPO.integration).bytes);
  const expectedCritical = [...new Set([...NATIVE, ...integration.sharedFiles.map(pin => pin.path)])].sort();
  assert.deepEqual(packet.nativeTypography.criticalFiles.map(pin => pin.path), expectedCritical);
  assert.equal(expectedCritical.length, 40);
  assert.equal(packet.integrity.completeTransitiveClosure, false);
  for (const relative of [TYPO.binding, TYPO.check, check.receipt.path])
    assert(!outputs[1].bytes.toString().includes(value.proof.files.get(relative).pin.sha256), relative);
});

test('optional SA binds P009 native source evidence and separate explicit playback without acceptance claims', () => {
  const value = fixture(); assert.equal(validateOptionalSpanishSource(value.files), true);
  const controller = value.files.get(SA.controller).bytes.toString();
  assert.equal(validateSpanishAudioSource(controller), true);
  for (const text of [
    controller.replace('sampleRate: 48_000', 'sampleRate: 22_050'),
    controller.replace('decodedSamples: 1_116_288', 'decodedSamples: 1_116_287'),
    controller.replace('spanish-audio.mp3', 'source-audio.mp3'),
  ]) assert.throws(() => validateSpanishAudioSource(text));
  const packet = plan(value).packet, optional = packet.optionalSpanishAudio;
  assert.deepEqual(optional.disposition, P009_OPTIONAL_SA_PINS.report);
  assert.equal(optional.mainPlaybackRetention, 'pause-and-retain-nonterminal-position');
  assert.deepEqual(Object.keys(optional.implementation), ['controller', 'controllerTest', 'server', 'serverTest', 'route']);
  for (const [name, pin] of Object.entries(optional.implementation)) assert.deepEqual(pin, value.files.get(SA[name]).pin);
  assert.equal(packet.embeddedAudio.sourceMp3.sha256, '15e60f13aad0e2187db0b32f6bcfe65151001a1ded336abd4fb4eb59b3014f2e');
  assert.equal(packet.selectedPages[0].runtime.frameCount, 394);
  const otherSource = clone(PHYSICAL_SOURCE_PINS); otherSource.spanishAudio.sha256 = 'a'.repeat(64);
  assert.throws(() => createAdmissionPlan(value.files, otherSource, value.proof), /exact physical source/u);
  for (const [relative, mutation] of [
    [SA.analysis, data => {data.source.mainActionTagCount = 1;}],
    [SA.analysis, data => {data.decode.framesPerChannel = 1116200;}],
    [SA.analysis, data => {data.language.listeningPerformed = true;}],
    [SA.receipt, data => {data.claimBoundary.originalRuntimeParity = true;}],
  ]) {
    const broken = fixture(), data = JSON.parse(broken.files.get(relative).bytes); mutation(data);
    put(broken.files, relative, data); assert.throws(() => plan(broken), /exact P009 optional SA source evidence/u);
  }
  const missing = fixture(); missing.files.delete(SA.serverTest);
  assert.throws(() => plan(missing), /required dependency/u);
  const report = fixture(); put(report.files, SA.report, 'unreviewed source-host disposition');
  assert.throws(() => plan(report), /exact P009 optional SA source evidence/u);
});

test('missing/pending/mismatched finalized typography never produces an active plan', () => {
  assert.throws(() => createAdmissionPlan(fixture().files, PHYSICAL_SOURCE_PINS), /finalized current/u);
  for (const mutation of [
    binding => {binding.preparationOnly = true;}, binding => {binding.implementation.status = 'candidate';},
    binding => {binding.unresolved = ['pending'];}, binding => {binding.sourceRiskEvidence.technicalRiskCheckRecorded = false;},
    binding => {binding.blocks[0].sourceShapeIds = [2];},
  ]) {
    const value = fixture(); changeBinding(value, mutation); assert.throws(() => plan(value));
  }
  for (const mutation of [
    check => {check.checks.accessibility = 'pending';}, check => {delete check.checks.performance;},
    check => {check.bindingSha256 = 'a'.repeat(64);}, check => {check.ownerAccepted = true;},
    check => {check.languagePolicy.es = 'source';}, check => {check.resolvedSourceRisks.pop();},
    check => {check.checkedImplementationFiles.pop();}, check => {delete check.checkEvidence.lifecycle;},
  ]) {
    const value = fixture(); changeCheck(value, mutation); assert.throws(() => plan(value));
  }
});

test('current native/controller/shared input drift and missing observation artifacts fail closed', () => {
  let value = fixture(); put(value.files, NATIVE[0], 'changed source-native input'); assert.throws(() => plan(value), /baseline current/u);
  value = fixture();
  const binding = JSON.parse(value.proof.files.get(TYPO.binding).bytes);
  const controller = binding.implementation.files.find(pin => pin.path === 'packages/demos/src/alg-l12-p009-embedded-audio.ts');
  value.proof.files.set(controller.path, {...value.proof.files.get(controller.path), pin: {...controller, sha256: 'b'.repeat(64)}});
  assert.throws(() => plan(value), /current typography implementation/u);
  value = fixture(); const check = JSON.parse(value.proof.files.get(TYPO.check).bytes);
  value.proof.files.delete(check.artifacts[0].path); assert.throws(() => plan(value), /technical artifact/u);
  value = fixture(); const shared = JSON.parse(value.files.get(TYPO.integration).bytes).sharedFiles[0];
  put(value.files, shared.path, 'changed shared file'); assert.throws(() => plan(value), /baseline current/u);
});

test('source placement, stream facts, glossary records and predecessor cannot be substituted', () => {
  for (const [relative, mutation] of [
    [PATHS.sourcePlacement, data => {data.globalOrdinal = 8;}],
    [PATHS.analysis, data => {data.source.mainFrameCount = 342;}],
    [PATHS.analysis, data => {data.timingSummary.continuousHypothesis.sourceHasTerminalStopAction = true;}],
    [PATHS.sourceGlossary, data => {data.sources[0].records.pop();}],
    [PATHS.sourceGlossary, data => {data.sources[0].records[0].key = 'Other dictionary key';}],
  ]) {
    const value = fixture(), data = JSON.parse(value.files.get(relative).bytes); mutation(data); put(value.files, relative, data);
    assert.throws(() => plan(value));
  }
  const value = fixture(); put(value.files, P009_PREDECESSOR.freezeManifest.path, '{}');
  assert.throws(() => plan(value), /retained P006 predecessor/u);
  assert.throws(() => createAdmissionPlan(fixture().files, {...PHYSICAL_SOURCE_PINS, source: {...PHYSICAL_SOURCE_PINS.source, sha256: 'c'.repeat(64)}}, fixture().proof), /exact physical/u);
});

test('AST validation rejects comment spoofing, duplicate flags, Boolean registration, 1x renderer and wrong schedule', () => {
  const timeline = actual(PATHS.timeline).bytes.toString(), module = actual(PATHS.module).bytes.toString();
  const audio = actual('packages/demos/src/alg-l12-p009-audio-schedule.ts').bytes.toString();
  assert(validateFinalTimeline(timeline)); assert(validateCanonicalModule(module)); assert(validateAudioSchedule(audio));
  assert.throws(() => validateFinalTimeline(timeline.replace("mainFrameDomain: 'sprite-62'", "mainFrameDomain: 'sprite-53' /* mainFrameDomain: 'sprite-62' */")));
  assert.throws(() => validateFinalTimeline(timeline.replace("registrationAuthority: 'private-current-js-registry',", "registrationAuthority: 'private-current-js-registry', currentJavaScriptRegistered: true,")));
  assert.throws(() => validateFinalTimeline(timeline.replace('audioPlaybackEnabled: true,', 'audioPlaybackEnabled: true, audioPlaybackEnabled: false,')));
  assert.throws(() => validateCanonicalModule(module.replace('Renderer: P009TypographyRenderer,', 'Renderer: candidate.module.Renderer,')));
  assert.throws(() => validateAudioSchedule(audio.replace('sourceTerminalStop: false,', 'sourceTerminalStop: true, /* sourceTerminalStop: false */')));
  assert.throws(() => validateAudioSchedule(audio.replace('firstAudioFrame: 2,', 'firstAudioFrame: 3,')));
});

test('physical reader rejects aliases, hardlinks, forged pins and metadata races without writes to sources', t => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p009-current-js-stable-')));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  fs.writeFileSync(path.join(root, 'input.txt'), 'isolated bytes'); const original = stableFile(root, 'input.txt');
  assert.throws(() => stableFile(root, '../escape'));
  assert.throws(() => stableFile(root, 'input.txt', {...original.pin, sha256: 'd'.repeat(64)}), /exact file pin/u);
  fs.symlinkSync(path.join(root, 'input.txt'), path.join(root, 'link.txt')); assert.throws(() => stableFile(root, 'link.txt'), /physical/u);
  let calls = 0;
  const racing = {...fs, lstatSync: (...args) => {
    const stat = fs.lstatSync(...args); calls++; return calls === 2 ? new Proxy(stat, {get: (object, key) => key === 'ctimeNs' ? object.ctimeNs + 1n : Reflect.get(object, key)}) : stat;
  }};
  assert.throws(() => stableFile(root, 'input.txt', undefined, racing), /stable read/u);
  fs.linkSync(path.join(root, 'input.txt'), path.join(root, 'hard.txt')); assert.throws(() => stableFile(root, 'input.txt'), /single-link/u);
});

test('CLI is read-only and real missing/stale proof produces inactive preparation with no fragment', t => {
  assert.deepEqual(parseArguments(['--dry-run']), {mode: '--dry-run'}); assert.deepEqual(parseArguments(['--check']), {mode: '--check'});
  for (const args of [[], ['--write'], ['--dry-run', '--write'], ['--check', 'other']]) assert.throws(() => parseArguments(args), /read-only/u);
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p009-current-js-missing-proof-')));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  assert.throws(() => prepareAdmission({root, sourceRoot: `${SOURCE_ROOT}/`}), /opt-in/u);
  const inactive = prepareAdmission({root, sourceRoot: SOURCE_ROOT});
  assert.equal(inactive.active, false); assert.equal(inactive.preparationState.activationPermitted, false);
  assert.equal(inactive.status, 'P009_TYPOGRAPHY_FINALIZATION_REQUIRED'); assert(!('plan' in inactive));
  const sourceBytes = fs.readFileSync(path.join(SOURCE_ROOT, PHYSICAL_SOURCE_PINS.source.path));
  // Current Main's initial pair is deliberately stale during admission wiring.
  // If it is refreshed concurrently, validate it; otherwise verify fail-closed.
  try {const proof = loadTypographyProof({sourceBytes}); assert.equal(proof.sourceCatalogContentSha256, SOURCE_CATALOG_SHA);}
  catch (error) {assert.match(error.message, /exact file pin/u);}
});
