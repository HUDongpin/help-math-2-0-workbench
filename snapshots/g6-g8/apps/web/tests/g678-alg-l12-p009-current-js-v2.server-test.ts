import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from '../lib/catalog';
import {algL12P006AdmissionCandidateDescriptor} from '../lib/g678-alg-l12-p006-current-js.server';
import {ALG_L12_P009_ADMISSION_INPUT_PATHS,
  ALG_L12_P009_SUPERSEDED_ADMISSION, ALG_L12_P009_MUTABLE_INTEGRATION_PATHS,
  ALG_L12_P009_CURRENT_JS_CALIBRATION, ALG_L12_P009_CURRENT_JS_FREEZE, ALG_L12_P009_CURRENT_JS_ID,
  algL12P009CurrentJsDescriptor, extendAlgL12P009CurrentJsDescriptor, readAlgL12P009CurrentJsPacket,
  type AlgL12P009CurrentJsPacket} from '../lib/g678-alg-l12-p009-current-js-v2.server';
import {g678RegisteredDescriptorsWithExtensions} from '../lib/g678-current-js-extensions.server';
import {g678RegisteredDescriptorsWithP009} from '../lib/g678-current-js-p009-successor-v2.server';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';
import {createAdmissionPlan, collectAdmissionInputs, PHYSICAL_SOURCE_PINS, SOURCE_CATALOG_SHA} from
  '../../../scripts/prepare-g678-alg-l12-p009-current-js-v2.mjs';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID = ALG_L12_P009_CURRENT_JS_ID, WORK = `migrations/${ID}`;
const BINDING = `catalog/typography-v1/g678-page-bindings/${ID}.json`;
const CHECK = `catalog/typography-v1/g678-checks/${ID}.json`;
const env: Record<string, string | undefined> = process.env;
type Pin = {path: string; bytes: number; sha256: string};
type Registration = NonNullable<ReturnType<typeof localOnlyAnimationModuleRegistration>>;
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const jsonBytes = (value: unknown) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

function local(run: () => void) {
  const keys = ['NODE_ENV', 'VERCEL', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
    'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
  const prior = Object.fromEntries(keys.map(key => [key, env[key]]));
  try {
    env.NODE_ENV = 'development'; delete env.VERCEL; delete env.VERCEL_ENV;
    env.HELP_MATH_G678_LOCAL_PREVIEW = '1'; env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT; run();
  } finally {
    for (const key of keys) if (prior[key] === undefined) delete env[key]; else env[key] = prior[key];
  }
}

/** Copies actual source/native/proof inputs into a temp root and rebinds only
 * the copied proof for validator tests. It never changes real evidence or
 * treats new admission code as technically accepted by the copied old run. */
function fixture() {
  const workspace = getWorkspaceRoot();
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), 'helpmath-p009-v2-admission-test-'));
  const write = (relative: string, bytes: Buffer) => {
    const file = path.join(root, relative); mkdirSync(path.dirname(file), {recursive: true}); writeFileSync(file, bytes);
  };
  const pin = (relative: string) => {
    const bytes = readFileSync(path.join(workspace, relative)); write(relative, bytes);
    return {path: relative, bytes: bytes.length, sha256: digest(bytes)};
  };
  // Use exactly the production producer's input collector. The reader's
  // required array is only an assertion below: adding it as fixture input
  // would hide another producer/consumer mismatch.
  const files: Map<string, {pin: Pin; bytes: Buffer}> = collectAdmissionInputs(workspace);
  for (const [relative, file] of files) write(relative, file.bytes);
  const binding = JSON.parse(readFileSync(path.join(workspace, BINDING)).toString());
  const check = JSON.parse(readFileSync(path.join(workspace, CHECK)).toString());
  const implementationFiles: Pin[] = [...new Set<string>([
    ...binding.implementation.files.map((file: Pin) => file.path), ...files.keys(),
    ...ALG_L12_P009_MUTABLE_INTEGRATION_PATHS])].sort().map(pin);
  for (const reference of [check.receipt, ...check.artifacts]) pin(reference.path);
  const receipt = JSON.parse(readFileSync(path.join(root, check.receipt.path)).toString());
  receipt.checkedImplementationFiles = implementationFiles;
  receipt.scope = 'Isolated copied/rebound production-plan validator fixture; no actual implementation, admission or acceptance effect.';
  binding.implementation.files = implementationFiles; check.checkedImplementationFiles = implementationFiles;
  const savePair = () => {
    const receiptBytes = jsonBytes(receipt), receiptPin = {path: check.receipt.path,
      bytes: receiptBytes.length, sha256: digest(receiptBytes)};
    write(receiptPin.path, receiptBytes); check.receipt = receiptPin;
    binding.sourceRiskEvidence.technicalReceipt = receiptPin; binding.technicalFinalization.receipt = receiptPin;
    check.artifacts = check.artifacts.map((file: Pin) => file.path === receiptPin.path ? receiptPin : file);
    const bindingBytes = jsonBytes(binding); write(BINDING, bindingBytes);
    check.bindingSha256 = digest(bindingBytes); write(CHECK, jsonBytes(check));
  };
  savePair();
  const proofFiles = new Map<string, {pin: Pin; bytes: Buffer}>();
  for (const reference of [
    {path: BINDING, bytes: 0, sha256: ''}, {path: CHECK, bytes: 0, sha256: ''},
    ...binding.implementation.files, ...check.artifacts,
  ] as Pin[]) {
    const bytes = readFileSync(path.join(root, reference.path));
    proofFiles.set(reference.path, {bytes, pin: {path: reference.path, bytes: bytes.length, sha256: digest(bytes)}});
  }
  const sourceCatalog = JSON.parse(files.get(`${WORK}/audit/source-text-catalog.json`)!.bytes.toString());
  const generatedPlan = createAdmissionPlan(files, PHYSICAL_SOURCE_PINS,
    {files: proofFiles, sourceCatalog, sourceCatalogContentSha256: SOURCE_CATALOG_SHA});
  // The production plan is authoritative here. No required pins are added to
  // its packet after generation, and only the temp root receives its outputs.
  for (const output of generatedPlan.outputs) write(output.path, output.bytes);
  const packet = generatedPlan.packet as unknown as AlgL12P009CurrentJsPacket;
  const savePacket = (next = packet): Registration => {
    const bytes = jsonBytes(next); write(ALG_L12_P009_CURRENT_JS_FREEZE.path, bytes);
    return {maturity: 'private-current-js', scope: 'private-engineering', deploymentScope: 'local-only',
      calibrationId: ALG_L12_P009_CURRENT_JS_CALIBRATION, freezeManifestSha256: digest(bytes),
      moduleSha256: next.entry.artifacts.module.sha256, timelineSha256: next.entry.artifacts.timeline.sha256,
      runtimeSha256: next.entry.artifacts.runtime.sha256};
  };
  return {root, packet, registration: savePacket(), binding, check, receipt, savePair, savePacket, write, generatedPlan,
    cleanup: () => rmSync(root, {recursive: true, force: true})};
}

test('formal P009 requires actual admission and successor retains preceding coverage while proof is unavailable', () => local(() => {
  const registration = localOnlyAnimationModuleRegistration(ID);
  if (!registration || registration.calibrationId !== ALG_L12_P009_CURRENT_JS_CALIBRATION) {
    assert.throws(() => readAlgL12P009CurrentJsPacket(), /actual private module registration/u);
    assert.throws(() => algL12P009CurrentJsDescriptor());
    assert.deepEqual(g678RegisteredDescriptorsWithP009(), g678RegisteredDescriptorsWithExtensions());
  } else {
    assert.equal(registration.calibrationId, ALG_L12_P009_CURRENT_JS_CALIBRATION);
    // A registered packet remains fail-closed during separately recorded proof
    // refreshes. This test never manufactures a successful real final proof.
    const pair = JSON.parse(readFileSync(path.join(getWorkspaceRoot(), BINDING)).toString());
    const pinsCurrent = pair.implementation.files.every((file: Pin) => {
      const bytes = readFileSync(path.join(getWorkspaceRoot(), file.path));
      return bytes.length === file.bytes && digest(bytes) === file.sha256;
    });
    if (!pinsCurrent) assert.throws(() => readAlgL12P009CurrentJsPacket(), /current bytes:|frozen admission closure/u);
    else {
      const descriptor = algL12P009CurrentJsDescriptor();
      assert.equal(descriptor.productBridge.registeredAnimationCount, 21);
      assert.equal(descriptor.pages[4]?.rendererAvailability.kind, 'unavailable');
      assert.equal(descriptor.pages[8]?.rendererAvailability.kind, 'registered');
      assert(Object.values(descriptor.productBridge.acceptanceEffects).every(value => value === false));
    }
  }
}));

test('actual production v2 plan crosses the strict reader without adding consumer-required fixture inputs', () => local(() => {
  const data = fixture();
  try {
    assert.deepEqual(data.packet.supersedes, ALG_L12_P009_SUPERSEDED_ADMISSION);
    assert.equal(data.packet.supersedes.formalAccepted, false);
    assert.deepEqual(data.packet.integrity.mutableBoundaryPaths, ALG_L12_P009_MUTABLE_INTEGRATION_PATHS);
    assert(ALG_L12_P009_ADMISSION_INPUT_PATHS.every(file => data.packet.integrity.files.some(pin => pin.path === file)));
    assert.equal(readAlgL12P009CurrentJsPacket(data.root, data.registration).calibrationId,
      ALG_L12_P009_CURRENT_JS_CALIBRATION);
    assert(data.generatedPlan.outputs[1]!.bytes.equals(readFileSync(path.join(data.root, ALG_L12_P009_CURRENT_JS_FREEZE.path))));
    const missingProducer = {...data.packet, integrity: {...data.packet.integrity,
      files: data.packet.integrity.files.filter(pin => pin.path !== 'scripts/prepare-g678-alg-l12-p009-typography-binding.mts')}};
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.savePacket(missingProducer)),
      /complete acyclic maintained admission closure/u);
    const falseHistory = {...data.packet, supersedes: {...data.packet.supersedes, formalAccepted: true}};
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.savePacket(falseHistory)), /exact source placement/u);
    data.savePacket();
    const historical = data.packet.supersedes.fragment;
    data.write(historical.path, Buffer.concat([readFileSync(path.join(data.root, historical.path)), Buffer.from('\n')]));
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /ordinary pin:|current bytes:/u);
  } finally {data.cleanup();}
}));

test('mutable global availability stays outside the freeze but remains required and current in live proof', () => local(() => {
  const data = fixture();
  try {
    const file = ALG_L12_P009_MUTABLE_INTEGRATION_PATHS[0]!;
    assert(!data.packet.integrity.files.some(pin => pin.path === file));
    const livePin = data.binding.implementation.files.find((pin: Pin) => pin.path === file) as Pin;
    assert(livePin);
    const frozen = {...data.packet, integrity: {...data.packet.integrity, files: [...data.packet.integrity.files, livePin]}};
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.savePacket(frozen)), /acyclic maintained admission closure/u);
    data.savePacket();
    const bytes = readFileSync(path.join(data.root, file));
    data.write(file, Buffer.concat([bytes, Buffer.from('\n// isolated availability wiring change\n')]));
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /ordinary pin:|current bytes:/u);
    data.write(file, bytes);
    data.binding.implementation.files = data.binding.implementation.files.filter((pin: Pin) => pin.path !== file);
    data.check.checkedImplementationFiles = data.binding.implementation.files;
    data.receipt.checkedImplementationFiles = data.binding.implementation.files; data.savePair();
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /entire frozen admission closure/u);
  } finally {data.cleanup();}
}));

test('isolated current proof validates exact native 2x source, complete closure, four risks and twelve checks', () => local(() => {
  const data = fixture();
  try {
    const packet = readAlgL12P009CurrentJsPacket(data.root, data.registration);
    assert.equal(packet.source.sha256, 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533');
    assert.equal(packet.nativeTypography.criticalFiles.length, new Set(data.packet.nativeTypography.criticalFiles.map(p => p.path)).size);
    assert.equal(packet.selectedPages[0]?.runtime.renderScale, 2);
    assert.deepEqual(packet.selectedPages[0]?.runtime.canvas, {width: 1600, height: 1200});
    assert(Object.values(packet.acceptanceEffects).every(value => value === false));
  } finally {data.cleanup();}
}));

test('packet rejects substituted scope, source, frame domain, buffer, audio, glossary, preparation and acceptance claims', () => local(() => {
  const data = fixture();
  try {
    const changed: AlgL12P009CurrentJsPacket[] = [
      {...data.packet, scope: 'private-production'},
      {...data.packet, source: {...data.packet.source, path: 'G6-G8-shared/ALG001/L12/VB/L12VB03.swf'}},
      {...data.packet, predecessor: {...data.packet.predecessor, registeredAnimationCount: 19}},
      {...data.packet, selectedPages: [{...data.packet.selectedPages[0]!, runtime: {
        ...data.packet.selectedPages[0]!.runtime, frameDomain: 'root'}}]},
      {...data.packet, selectedPages: [{...data.packet.selectedPages[0]!, runtime: {
        ...data.packet.selectedPages[0]!.runtime, fps: 24}}]},
      {...data.packet, selectedPages: [{...data.packet.selectedPages[0]!, runtime: {
        ...data.packet.selectedPages[0]!.runtime, renderScale: 1, canvas: {width: 800, height: 600}}}]},
      {...data.packet, embeddedAudio: {...data.packet.embeddedAudio, sourceTerminalStop: true}},
      {...data.packet, glossary: {...data.packet.glossary, buttonCount: 7}},
      {...data.packet, entry: {...data.packet.entry, artifacts: {...data.packet.entry.artifacts,
        runtime: data.packet.nativeTypography.runtime}}},
      {...data.packet, preparationState: {...data.packet.preparationState, activationPermitted: false}},
      {...data.packet, acceptanceEffects: {...data.packet.acceptanceEffects, audioAccepted: true}},
    ];
    for (const packet of changed)
      assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.savePacket(packet)), /ALG_L12_P009_CURRENT_JS_INVALID/u);
    data.savePacket();
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, {...data.registration,
      runtimeSha256: '0'.repeat(64)}), /runtime bindings/u);
  } finally {data.cleanup();}
}));

test('prepared registration runtime is the exact native byte copy and never a frozen source input', () => local(() => {
  const data = fixture();
  try {
    const alias = data.packet.entry.artifacts.runtime;
    assert.notEqual(alias.path, data.packet.nativeTypography.runtime.path);
    assert.equal(alias.sha256, data.packet.nativeTypography.runtime.sha256);
    assert.equal(alias.bytes, data.packet.nativeTypography.runtime.bytes);
    assert(!data.packet.integrity.files.some(pin => pin.path === alias.path));
    assert(!data.binding.implementation.files.some((pin: Pin) => pin.path === alias.path));
    const bytes = readFileSync(path.join(data.root, alias.path));
    const changed = Buffer.from(bytes); changed[changed.length - 1] ^= 1; data.write(alias.path, changed);
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /current bytes:/u);
    data.write(alias.path, bytes);
    const packet = {...data.packet, integrity: {...data.packet.integrity, files: [...data.packet.integrity.files, alias]}};
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.savePacket(packet)), /acyclic maintained admission closure/u);
  } finally {data.cleanup();}
}));

test('optional SA rejects locale autoplay, offset resume, terminal restart, native decode substitution and acceptance claims', () => local(() => {
  const data = fixture();
  try {
    const sa = data.packet.optionalSpanishAudio;
    assert.equal(readAlgL12P009CurrentJsPacket(data.root, data.registration).optionalSpanishAudio.source.sha256, sa.source.sha256);
    for (const changed of [
      {...sa, automaticLocalePlayback: true}, {...sa, playbackPolicy: 'concatenate-to-embedded-stream'},
      {...sa, pauseRestartPolicy: 'resume-saved-audio-offset'}, {...sa, returnPolicy: 'restart-main-at-frame-one'},
      {...sa, nativeAudio: {...sa.nativeAudio, sampleRate: 22050}}, {...sa, spokenLanguageVerified: true},
      {...sa, listeningAccepted: true}, {...sa, source: {...sa.source, sha256: '0'.repeat(64)}},
      {...sa, disposition: {...sa.disposition, sha256: '0'.repeat(64)}},
      {...sa, sourceHostProof: {...sa.sourceHostProof, receipt: {...sa.sourceHostProof.receipt, sha256: '0'.repeat(64)}}},
      {...sa, implementation: {...sa.implementation,
        controller: sa.implementation.controllerTest, controllerTest: sa.implementation.controller}},
    ]) {
      const packet = {...data.packet, optionalSpanishAudio: changed};
      assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.savePacket(packet)), /explicit separate optional SA/u);
    }
    data.savePacket();
    const controllerPath = sa.implementation.controller.path;
    data.write(controllerPath, Buffer.concat([readFileSync(new URL(`../../../${controllerPath}`, import.meta.url)), Buffer.from('\n// fixture SA drift\n')]));
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /ordinary pin:|current bytes:/u);
  } finally {data.cleanup();}
}));

test('formal proof rejects current implementation drift, omitted admission wiring and hash-substituted pairs', () => local(() => {
  const data = fixture();
  try {
    const shared = data.binding.implementation.files.find((pin: Pin) => pin.path === 'apps/web/components/site-header.tsx') as Pin;
    assert(shared); assert(!data.packet.integrity.files.some(pin => pin.path === shared.path));
    data.write(shared.path, Buffer.concat([readFileSync(path.join(data.root, shared.path)), Buffer.from('\n// fixture drift\n')]));
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /(?:ordinary pin:|current bytes:) apps\/web\/components\/site-header/u);
    data.write(shared.path, readFileSync(path.join(getWorkspaceRoot(), shared.path)));
    const removed = 'apps/web/lib/g678-current-js-p009-successor-v2.server.ts';
    data.binding.implementation.files = data.binding.implementation.files.filter((pin: Pin) => pin.path !== removed);
    data.check.checkedImplementationFiles = data.binding.implementation.files;
    data.receipt.checkedImplementationFiles = data.binding.implementation.files; data.savePair();
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /entire frozen admission closure/u);
    data.check.bindingSha256 = '0'.repeat(64); data.write(CHECK, jsonBytes(data.check));
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /current finalized technical typography pair/u);
  } finally {data.cleanup();}
}));

test('proof rejects renamed gates, unresolved source risks and checks without independent observation references', () => local(() => {
  const data = fixture();
  try {
    data.binding.independentAcceptance.inventedGate = false; delete data.binding.independentAcceptance.audioAccepted;
    data.savePair();
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /current finalized technical typography pair/u);
    data.binding.independentAcceptance.audioAccepted = false; delete data.binding.independentAcceptance.inventedGate;
    data.check.resolvedSourceRisks = data.check.resolvedSourceRisks.slice(1); data.savePair();
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /source risks/u);
    data.check.resolvedSourceRisks = data.receipt.resolvedSourceRisks;
    data.check.checkEvidence.semanticText.artifactPaths = []; data.receipt.checkEvidence.semanticText.artifactPaths = [];
    data.savePair();
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /separate observation evidence/u);
  } finally {data.cleanup();}
}));

test('proof preserves empty observation files and denies changed artifacts or symbolic-link substitution', () => local(() => {
  const data = fixture();
  try {
    const artifact = data.check.artifacts.find((pin: Pin) => pin.path !== data.check.receipt.path) as Pin;
    assert(artifact); const original = readFileSync(path.join(data.root, artifact.path));
    data.write(artifact.path, Buffer.concat([original, Buffer.from('changed')]));
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /ordinary pin:|current bytes:/u);
    data.write(artifact.path, original);
    const alias = `${artifact.path}.fixture-target`; data.write(alias, original);
    rmSync(path.join(data.root, artifact.path)); symlinkSync(path.join(data.root, alias), path.join(data.root, artifact.path));
    assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /physical bounded pin/u);
  } finally {data.cleanup();}
}));

test('descriptor extension changes only ordinal9, preserves P005/P006/P007 and adds the four source dictionary entries', () => local(() => {
  const data = fixture();
  try {
    const packet = readAlgL12P009CurrentJsPacket(data.root, data.registration);
    // The explicit staging descriptor is used only as a copied unit input to the
    // pure extension function. The formal export never imports or selects it.
    const base = algL12P006AdmissionCandidateDescriptor();
    const extended = extendAlgL12P009CurrentJsDescriptor(base, packet, data.registration);
    assert.equal(extended.pages.length, 52); assert.equal(extended.productBridge.registeredAnimationCount, 21);
    base.pages.forEach((page, index) => {if (index !== 8) assert.equal(extended.pages[index], page);});
    assert.deepEqual(extended.pages.map(page => page.placementId), base.pages.map(page => page.placementId));
    assert.equal(extended.sections, base.sections); assert.equal(extended.pages[4]!.rendererAvailability.kind, 'unavailable');
    assert.equal(extended.pages[5]!.rendererAvailability.kind, 'registered');
    assert.equal(extended.pages[6]!.rendererAvailability.kind, 'registered');
    assert.equal(extended.glossary.length, 39);
    base.glossary.forEach((entry, index) => assert.equal(extended.glossary[index], entry));
    assert.deepEqual(extended.glossary.slice(35).map(entry => entry.sourceKeyAttribute), ['Pair', 'Locate', 'X-coordinate', 'Y-coordinate']);
    assert(Object.values(extended.productBridge.acceptanceEffects).every(value => value === false));
    const wrongCount: PageOnlyLessonPlayerDescriptor = {...base, productBridge: {...base.productBridge, registeredAnimationCount: 19}};
    assert.throws(() => extendAlgL12P009CurrentJsDescriptor(wrongCount, packet, data.registration), /strict source-ordered P006 predecessor/u);
    const wrongSource: PageOnlyLessonPlayerDescriptor = {...base, source: {...base.source, candidateFreezeManifestSha256: '0'.repeat(64)}};
    assert.throws(() => extendAlgL12P009CurrentJsDescriptor(wrongSource, packet, data.registration), /strict source-ordered P006 predecessor/u);
  } finally {data.cleanup();}
}));

test('local-only and physical-source gates deny production, provider, broad bindings and compatibility roots', () => local(() => {
  const data = fixture();
  try {
    const cases: ReadonlyArray<readonly [string, string | undefined]> = [
      ['NODE_ENV', 'production'], ['VERCEL_ENV', 'preview'], ['VERCEL', '1'],
      ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'], ['HELP_MATH_G678_LOCAL_PREVIEW', '0'],
      ['HELP_MATH_G678_SOURCE_ROOT', undefined], ['HELP_MATH_G678_SOURCE_ROOT', `${SOURCE_ROOT}/`],
      ['HELP_MATH_G678_SOURCE_ROOT', '/Volumes/WestWorld/HELP MATH 2.0/source-assets/G6-G8-shared'],
    ];
    for (const [key, value] of cases) {
      const previous = env[key]; if (value === undefined) delete env[key]; else env[key] = value;
      assert.throws(() => readAlgL12P009CurrentJsPacket(data.root, data.registration), /physical local Preview only/u);
      if (previous === undefined) delete env[key]; else env[key] = previous;
    }
    const source = readFileSync(path.join(getWorkspaceRoot(), 'apps/web/lib/g678-alg-l12-p009-current-js-v2.server.ts'), 'utf8');
    assert(!source.includes('algL12P006AdmissionCandidateDescriptor'));
    assert(!source.includes('process.env.HELP_MATH_P009_BYPASS'));
    assert(existsSync(path.join(getWorkspaceRoot(), ALG_L12_P009_ADMISSION_INPUT_PATHS[0]!)));
  } finally {data.cleanup();}
}));
