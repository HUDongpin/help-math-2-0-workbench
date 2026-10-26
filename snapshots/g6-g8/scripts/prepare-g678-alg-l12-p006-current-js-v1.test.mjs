import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  createAdmissionPlan, digest, parseArguments, PHYSICAL_SOURCE_PINS,
  P006_ADMISSION_PATHS, P006_TYPOGRAPHY_PATHS, P006_TYPOGRAPHY_CHECKS,
  P006_NATIVE_TYPOGRAPHY_PATHS, P006_HOST_DISCLOSURE_PINS,
  P006_EXCLUDED_FREEZE_PATHS, REQUIRED_WORKSPACE_PATHS, stableFile, validateFinalTimeline,
} from './prepare-g678-alg-l12-p006-current-js-v1.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';

const ID = 'shared-alg001-l12-p006';
const CATALOG_SHA = 'ade09b22c6df92ebbef45c15154abe20e60ffff2f8328dd9e1b877b734611996';
const BASE_RUNTIME_SHA = 'b2fd1788ce5bab5efab167bf303608da66621ead66f6d276979fb09558b39ddc';
const RISK_NAMES = ['shape-text-unclassified', 'bitmap-text-unclassified',
  'button-runtime-state-and-actions-not-interpreted', 'actionscript-visibility-and-values-not-interpreted',
  'mask-filter-blend-semantics-unresolved'];
const ARTIFACT_PATH = 'output/p006-admission-test/source-and-host-positive.json';
const RECEIPT_PATH = 'output/p006-admission-test/technical-evidence.json';
const TIMELINE = `export const SHARED_ALG001_L12_P006_SOURCE = Object.freeze({
  currentJavaScriptRegistered: true, audioPlaybackEnabled: true,
  productCalibrationPassed: false, strictAcceptanceEffect: 'none',
  spanishTextPolicy: 'english-source-fallback-translation-pending',
  source: {path: '${PHYSICAL_SOURCE_PINS.source.path}', sha256: '${PHYSICAL_SOURCE_PINS.source.sha256}'},
} as const);
export const SHARED_ALG001_L12_P006_CONFIG = Object.freeze({
  mainFrameDomain: 'sprite-53', mainFrameCount: 342, rootFrameCount: 10,
  rootBeginFrame: 6, livePlaybackEndFrame: 342, assetSha256: '${BASE_RUNTIME_SHA}',
});`;

function put(map, relative, value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value :
    `${JSON.stringify(value, null, 2)}\n`);
  const file = {bytes, pin: {path: relative, bytes: bytes.length, sha256: digest(bytes)}};
  map.set(relative, file); return file;
}
const copyPins = references => references.map(reference => ({...reference}));

/** The pure constructor receives verified pins. Separate filesystem tests
 * exercise physical byte integrity; these small records test admission rules. */
function fixture() {
  const files = new Map();
  for (const relative of REQUIRED_WORKSPACE_PATHS) put(files, relative, relative);
  files.get(P006_ADMISSION_PATHS.candidate).pin = {
    path: P006_ADMISSION_PATHS.candidate, bytes: 11507597, sha256: BASE_RUNTIME_SHA,
  };
  put(files, P006_ADMISSION_PATHS.timeline, TIMELINE);
  files.get(P006_TYPOGRAPHY_PATHS.sourceDisposition).pin.sha256 =
    '2a2485b939b4c2fcf853afca4143c611bc30624471ab268111e0fd34387dd89b';
  files.get(P006_ADMISSION_PATHS.host).pin = {path: P006_ADMISSION_PATHS.host,
    ...P006_HOST_DISCLOSURE_PINS.prior};
  const shared = put(files, 'packages/demos/src/lesson-text.ts', 'shared native teaching text');
  put(files, P006_TYPOGRAPHY_PATHS.integration, {
    kind: 'g678-lesson-typography-integration-v1', baselineEntries: [], sharedFiles: [shared.pin],
  });
  const native = files.get(P006_TYPOGRAPHY_PATHS.runtime).pin;
  const meta = {animationId: ID, sourceSwfSha256: PHYSICAL_SOURCE_PINS.source.sha256,
    runtimeSha256: native.sha256, runtimeBytes: native.bytes};
  put(files, P006_TYPOGRAPHY_PATHS.runtimeMetadata, meta);
  put(files, P006_TYPOGRAPHY_PATHS.exactSuppressionManifest, {
    ...meta, schemaVersion: 1, kind: 'p006-exact-placement-typography-v1',
    originalCandidate: 'candidate-v2', originalRuntimeSha256: BASE_RUNTIME_SHA,
    originalRuntimeBytes: 11507597, globalRegistry: 'HELP_MATH_P006_TYPOGRAPHY_ASSETS',
    generator: {sha256: files.get(P006_TYPOGRAPHY_PATHS.generator).pin.sha256,
      sourceParserSha256: files.get(P006_TYPOGRAPHY_PATHS.sourceParser).pin.sha256},
    evidence: {title: {id: 'root:65:1:56/sprite-56:1:1:55'},
      question: {id: 'root:1:1:53/sprite-53:20:1:46'},
      underlines: {id: 'root:1:1:53/sprite-53:19:1:44'},
      background: {id: 'root:1:1:53/sprite-53:17:17:42'}, questionRevealMask: {preserved: true}},
    drawing: {ordinaryRenderPreservesSourceWrapper: true, sourceMaskAllocationsPreserved: true,
      nonTextFunctionsModified: false},
  });
  const proofFiles = new Map(files);
  const positive = put(proofFiles, ARTIFACT_PATH, {sourceAndHostChecksPassed: true});
  // The original pair omitted the custom generator; its manifest already
  // bound that exact generator. This narrow, checked exception is retained.
  const implementation = [...files.values()].filter(file =>
    !P006_EXCLUDED_FREEZE_PATHS.includes(file.pin.path) &&
    file.pin.path !== P006_TYPOGRAPHY_PATHS.generator).map(file => ({...file.pin}));
  const binding = {schemaVersion: 1, animationId: ID, placementId: ID,
    sourceSwfSha256: PHYSICAL_SOURCE_PINS.source.sha256, sourceCatalogContentSha256: CATALOG_SHA,
    sourceRelativePath: PHYSICAL_SOURCE_PINS.source.path,
    preparationOnly: false, unresolved: [], languagePolicy: {en: 'source', es: 'source-fallback'},
    implementation: {files: implementation}, blocks: [
      {id: 'title', role: 'title', sourceShapeIds: [55], instance: {id: 'root:65:1:56/sprite-56:1:1:55'}},
      {id: 'question', role: 'question', sourceTextIds: Array.from({length: 7}, (_, n) => `character-46/run-${n}`),
        instance: {id: 'root:1:1:53/sprite-53:20:1:46'}},
    ]};
  const bindingFile = put(proofFiles, P006_TYPOGRAPHY_PATHS.binding, binding);
  const checks = Object.fromEntries(P006_TYPOGRAPHY_CHECKS.map(name => [name, 'passed']));
  const identity = {schemaVersion: 1, animationId: ID, placementId: ID,
    sourceSwfSha256: PHYSICAL_SOURCE_PINS.source.sha256, sourceCatalogContentSha256: CATALOG_SHA,
    checkedAt: '2026-09-26T18:00:00.000Z', checks};
  const receipt = put(proofFiles, RECEIPT_PATH, {...identity,
    kind: 'p006-technical-typography-evidence-v1', checkedImplementationFiles: copyPins(implementation)});
  const check = {...identity, kind: 'g678-lesson-typography-check-v1',
    bindingSha256: bindingFile.pin.sha256, receipt: receipt.pin,
    languagePolicy: {en: 'source', es: 'source-fallback'},
    resolvedSourceRisks: [...RISK_NAMES], sourceRiskResolutions: RISK_NAMES.map(kind =>
      ({kind, disposition: 'Source disposition and real host evidence retained.', artifactPaths: [ARTIFACT_PATH]})),
    artifacts: [positive.pin, receipt.pin], checkedImplementationFiles: copyPins(implementation),
    humanReviewed: false, ownerAccepted: false, originalRuntimeAccepted: false,
    audioAccepted: false, strictComplete: false, published: false,
    currentJavaScriptRegistrationEffect: 'none', strictCompletionEffect: 'none', publicationEffect: 'none'};
  put(proofFiles, P006_TYPOGRAPHY_PATHS.check, check);
  return {files, proof: {files: proofFiles, sourceCatalogContentSha256: CATALOG_SHA,
    sourceCatalog: {sourceSha256: PHYSICAL_SOURCE_PINS.source.sha256,
      unparsedTags: [], risks: RISK_NAMES.map(kind => ({kind}))}}};
}
const plan = value => createAdmissionPlan(value.files, PHYSICAL_SOURCE_PINS, value.proof);
function changeCheck(value, mutation) {
  const check = JSON.parse(value.proof.files.get(P006_TYPOGRAPHY_PATHS.check).bytes);
  mutation(check); put(value.proof.files, P006_TYPOGRAPHY_PATHS.check, check);
}

test('reviewed native freeze/fragment register exactly P006 without closing acceptance', () => {
  const value = fixture();
  const {packet, fragment, outputs} = plan(value);
  const registry = upsertPrivateCurrentJsCalibration({schemaVersion: 2,
    registryScope: 'private-engineering', calibrations: []}, fragment);
  assert.equal(registry.calibrations[0].entries[0].key, ID);
  assert.equal(fragment.freezeManifestSha256, digest(outputs[1].bytes));
  assert.equal(fragment.freezeManifestBytes, outputs[1].bytes.length);
  assert.deepEqual(outputs.map(output => output.path), [P006_ADMISSION_PATHS.runtime,
    P006_ADMISSION_PATHS.freeze, P006_ADMISSION_PATHS.fragment]);
  assert.equal(packet.entry.artifacts.runtime.sha256, BASE_RUNTIME_SHA);
  assert.equal(packet.nativeTypography.runtime.sha256, value.files.get(P006_TYPOGRAPHY_PATHS.runtime).pin.sha256);
  for (const relative of [...P006_NATIVE_TYPOGRAPHY_PATHS, 'packages/demos/src/lesson-text.ts',
    'packages/demos/src/generated/alg-l12-p006-hit-spec.ts',
    'apps/web/components/g678-multi-page-lesson-player-v5.generated.tsx',
    'apps/web/lib/g678-private-playback-decision-v1.ts',
    'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p007/page.tsx',
    'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p006-admission/page.tsx'])
    assert(packet.integrity.files.some(pin => pin.path === relative), relative);
  assert.equal(packet.preparationState.typographyImplementation, 'source-bound-implemented');
  assert.equal(packet.preparationState.activationPermitted, true);
  assert.equal(packet.preparationState.status, 'admission-reviewed');
  assert.equal(packet.preparationState.postRegistrationTypographyCheckRequired, true);
  assert.equal(packet.integrity.completeTransitiveClosure, false);
  assert.deepEqual(packet.embeddedAudio.sourceSampleRange, [1673, 624384]);
  assert.equal(packet.embeddedAudio.scheduleVersion, 'continuous-stream-v2');
  assert.equal(packet.optionalSpanishAudio.automaticLocalePlayback, false);
  assert.equal(packet.optionalSpanishAudio.spokenLanguageVerified, false);
  assert(Object.values(packet.acceptanceEffects).every(effect => effect === false));
  assert.equal(packet.productCalibrationPassed, false);
  assert.equal(packet.scaleOutAuthorized, false);
  assert.deepEqual(plan(value).outputs, outputs, 'deterministic output bytes');
});

test('freeze excludes direct/indirect typography and generated-dispatch hash cycles', () => {
  const value = fixture();
  for (const relative of [...P006_EXCLUDED_FREEZE_PATHS, RECEIPT_PATH])
    value.files.set(relative, value.proof.files.get(relative) ??
      {bytes: Buffer.from(relative), pin: {path: relative, bytes: relative.length, sha256: digest(relative)}});
  const {packet, outputs} = plan(value);
  const paths = packet.integrity.files.map(pin => pin.path);
  for (const relative of [...P006_EXCLUDED_FREEZE_PATHS, RECEIPT_PATH]) assert(!paths.includes(relative), relative);
  for (const relative of [P006_TYPOGRAPHY_PATHS.binding, P006_TYPOGRAPHY_PATHS.check, RECEIPT_PATH])
    assert(!outputs[1].bytes.toString('utf8').includes(value.proof.files.get(relative).pin.sha256), relative);
});

test('missing dependencies, missing proof, substituted source and changed base runtime fail closed', () => {
  for (const relative of ['packages/demos/src/alg-l12-p006-spanish-audio.ts',
    'packages/demos/src/generated/alg-l12-p006-hit-spec.ts',
    'apps/web/lib/g678-private-playback-decision-v1.ts',
    'packages/demos/src/alg-l12-p006-typography-renderer.tsx']) {
    const value = fixture(); value.files.delete(relative);
    assert.throws(() => plan(value), /required dependency/u, relative);
  }
  assert.throws(() => createAdmissionPlan(fixture().files), /required typography technical proof/u);
  const source = fixture();
  assert.throws(() => createAdmissionPlan(source.files, {...PHYSICAL_SOURCE_PINS,
    source: {...PHYSICAL_SOURCE_PINS.source, sha256: '0'.repeat(64)}}, source.proof), /exact source pin/u);
  const runtime = fixture(); runtime.files.get(P006_ADMISSION_PATHS.candidate).pin.sha256 = '0'.repeat(64);
  assert.throws(() => plan(runtime), /runtime\/controller input changed|canonical v2 runtime/u);
});

test('claimed pass refuses missing checks, incomplete risk evidence and mismatched identity', () => {
  for (const [mutation, expected] of [
    [check => {delete check.checks.accessibility;}, /all twelve/u],
    [check => {check.checks.lifecycle = 'pending';}, /all twelve/u],
    [check => {check.resolvedSourceRisks.pop();}, /complete source-risk/u],
    [check => {check.bindingSha256 = '0'.repeat(64);}, /matching typography/u],
    [check => {check.sourceSwfSha256 = '0'.repeat(64);}, /matching typography/u],
    [check => {check.humanReviewed = true;}, /independent pending gate/u],
    [check => {check.checkedAt = '2999-01-01T00:00:00.000Z';}, /valid dated/u],
    [check => {check.sourceRiskResolutions[0].artifactPaths = ['output/unbound.json'];}, /hash-bound source-risk/u],
  ]) {
    const value = fixture(); changeCheck(value, mutation); assert.throws(() => plan(value), expected);
  }
  const unresolved = fixture();
  const binding = JSON.parse(unresolved.proof.files.get(P006_TYPOGRAPHY_PATHS.binding).bytes);
  binding.unresolved = ['responsive matrix missing'];
  put(unresolved.proof.files, P006_TYPOGRAPHY_PATHS.binding, binding);
  assert.throws(() => plan(unresolved), /completed source-bound/u);
});

test('unchanged passed labels cannot hide changed artifacts, native CSS or audio/controllers', () => {
  const evidence = fixture(); put(evidence.proof.files, ARTIFACT_PATH, 'altered result');
  assert.throws(() => plan(evidence), /technical artifact changed/u);
  const receipt = fixture(); put(receipt.proof.files, RECEIPT_PATH, 'altered receipt');
  assert.throws(() => plan(receipt), /technical artifact changed/u);
  for (const relative of ['packages/demos/src/alg-l12-p006-typography.css',
    'packages/demos/src/alg-l12-p006-audio-transport.ts',
    'packages/demos/src/alg-l12-p006-host-policy.ts',
    'apps/web/lib/g678-private-glossary-pause-v1.ts', 'packages/demos/src/lesson-text.ts']) {
    const value = fixture(); put(value.files, relative, 'unreviewed behavior');
    assert.throws(() => plan(value), /runtime\/controller input changed/u, relative);
  }
});

test('only the reviewed three host disclosure replacements inherit dated host proof', () => {
  const reviewed = fixture();
  reviewed.files.get(P006_ADMISSION_PATHS.host).pin = {path: P006_ADMISSION_PATHS.host,
    ...P006_HOST_DISCLOSURE_PINS.reviewed};
  assert.equal(plan(reviewed).packet.hostAdapter.sha256, P006_HOST_DISCLOSURE_PINS.reviewed.sha256);
  const altered = fixture(); put(altered.files, P006_ADMISSION_PATHS.host, 'extra audio behavior change');
  assert.throws(() => plan(altered), /only the reviewed three host disclosure/u);
});

test('reviewed admission wiring is frozen at new bytes while final timeline remains required', () => {
  const value = fixture();
  const changed = put(value.files, 'scripts/prepare-g678-alg-l12-p006-current-js-v1.mjs', 'reviewed admission change');
  assert.equal(plan(value).packet.integrity.files.find(pin => pin.path === changed.pin.path).sha256, changed.pin.sha256);
  const rejected = fixture();
  put(rejected.files, P006_ADMISSION_PATHS.timeline, TIMELINE.replace('audioPlaybackEnabled: true', 'audioPlaybackEnabled: false'));
  assert.throws(() => plan(rejected), /final timeline declaration/u);
});

test('native adapter identity cannot separate from its exact source generator', () => {
  const value = fixture(); put(value.files, P006_TYPOGRAPHY_PATHS.generator, 'unreviewed generator');
  assert.throws(() => plan(value), /exact native adapter generator\/parser/u);
  const scope = fixture(); scope.proof.sourceCatalog.unparsedTags = [{tag: 'unknown'}];
  assert.throws(() => plan(scope), /actual source typography catalog/u);
});

test('stable reader rejects symlink aliases, hardlinks, unstable reads and wrong bytes', () => {
  const bytes = Buffer.from('fixture');
  const stat = {dev: 1n, ino: 2n, size: BigInt(bytes.length), mode: 0o100644n,
    mtimeNs: 3n, ctimeNs: 4n, nlink: 1n, isFile: () => true, isSymbolicLink: () => false};
  const io = {realpathSync: file => file, lstatSync: () => stat, readFileSync: () => bytes};
  assert.equal(stableFile('/fixture', 'input', undefined, io).pin.sha256, digest(bytes));
  assert.throws(() => stableFile('/fixture', 'input', undefined,
    {...io, realpathSync: () => '/another/input'}), /physical path/u);
  assert.throws(() => stableFile('/fixture', 'input', undefined,
    {...io, lstatSync: () => ({...stat, nlink: 2n})}), /ordinary file/u);
  let calls = 0;
  assert.throws(() => stableFile('/fixture', 'input', undefined,
    {...io, lstatSync: () => ({...stat, mtimeNs: BigInt(++calls)})}), /stable read/u);
  assert.throws(() => stableFile('/fixture', '../input', undefined, io), /relative file boundary/u);
  assert.throws(() => stableFile('/fixture', 'input', {bytes: 7, sha256: '0'.repeat(64)}, io), /exact source binding/u);
});

test('CLI defaults to read-only and rejects unknown or combined modes', () => {
  assert.equal(parseArguments([]), '--dry-run');
  for (const mode of ['--dry-run', '--check', '--write']) assert.equal(parseArguments([mode]), mode);
  assert.throws(() => parseArguments(['--write', '--check']), /Usage/u);
  assert.throws(() => parseArguments(['--root', '/another']), /Usage/u);
  assert.throws(() => parseArguments(['--force']), /Usage/u);
});

test('final timeline preserves source frame identity and pending independent acceptance', () => {
  validateFinalTimeline(TIMELINE);
  assert.throws(() => validateFinalTimeline(TIMELINE.replace('currentJavaScriptRegistered: true',
    'currentJavaScriptRegistered: false')), /final timeline declaration/u);
  assert.throws(() => validateFinalTimeline(TIMELINE.replace('mainFrameCount: 342', 'mainFrameCount: 343')),
    /final timeline identity/u);
  assert.throws(() => validateFinalTimeline(TIMELINE.replace('currentJavaScriptRegistered: true',
    'currentJavaScriptRegistered: false /* currentJavaScriptRegistered: true */')), /final timeline declaration/u);
  assert.throws(() => validateFinalTimeline(TIMELINE.replace('currentJavaScriptRegistered: true',
    'currentJavaScriptRegistered: false, currentJavaScriptRegistered: true')), /duplicate timeline property/u);
});
