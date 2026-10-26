import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';
import {CATALOG, PLANNER, PRIOR, PROPOSED_FREEZE, SOURCE_AUTHORITY, composeP042ReadableRegistration}
  from '../../../scripts/plan-g678-nms-l01-p042-readable-registration.mjs';
import {G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT, G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT}
  from '../lib/g678-instructional-behavior-delta-authority.server';
import {G678_MATH_COMPANION_AUTHORITY, G678_MATH_COMPANION_SUFFIXES} from '../lib/g678-math-companion-authority.server';
import {G678_P042_AUTHORITY, G678_P042_BASE, G678_P042_FAMILY, G678_P042_ID, G678_P042_PREDECESSOR,
  G678_P042_READABLE, G678_P042_RUNTIME, G678_P042_RUN_PATH, G678_P042_SUFFIX} from '../lib/g678-nms-l01-p042-companion-authority.server';

process.env.HELP_MATH_G678_CALIBRATION_PHASE = 'nms-l01-p042-companion-provisional-browser-qa';
const bridge = await import('../lib/g678-calibration-product-bridge.server');
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const absolute = (path: string) => new URL(`../../../${path}`, import.meta.url);
const read = (path: string) => {
  const bytes = readFileSync(absolute(path));
  return {bytes: bytes.length, path, sha256: hash(bytes), value: JSON.parse(bytes.toString('utf8'))};
};
const bind = (path: string, value: any) => {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n');
  return {bytes: bytes.length, path, sha256: hash(bytes), value};
};
const descriptor = ({path, bytes, sha256}: ReturnType<typeof read>) => ({path, bytes, sha256});

function fixture() {
  const priorFreeze = read(PRIOR.freeze.path), priorFragment = read(PRIOR.fragment.path);
  const priorRegistry = read(existsSync(absolute(PRIOR.registry.path)) ? PRIOR.registry.path :
    'packages/demos/private-current-js-registry.json');
  const source = read(SOURCE_AUTHORITY.path), pagesCatalog = read(CATALOG.path);
  const plannerBytes = readFileSync(absolute(PLANNER));
  // The actual reviewed planner is composed only in memory; these tests do
  // not prepare/activate registry artifacts or inject a product renderer.
  const projected = composeP042ReadableRegistration({priorFreeze: priorFreeze.value, priorFragment: priorFragment.value,
    priorRegistry: priorRegistry.value, source: source.value, pagesCatalog: pagesCatalog.value,
    plannerBinding: {path: PLANNER, bytes: plannerBytes.length, sha256: hash(plannerBytes)}});
  const freeze = bind(PROPOSED_FREEZE, projected.freeze);
  const entries = new Map(projected.fragment.calibration.entries.map((entry: any) => [entry.key, entry]));
  const registry = {hasModule: (id: string) => entries.has(id), registrationFor: (id: string) => {
    const entry = entries.get(id) as any;
    if (!entry) return undefined;
    const artifact = entry.artifacts;
    return {scope: 'private-engineering', maturity: 'private-current-js', deploymentScope: 'local-only',
      calibrationId: bridge.G678_CALIBRATION_ID, freezeManifestSha256: freeze.sha256,
      moduleSha256: artifact.module.sha256, timelineSha256: artifact.timeline.sha256,
      ...(artifact.kind === 'maintained-dom-module-v1' ? {rendererBindingKind: artifact.kind,
        memberManifestSha256: artifact.memberManifest.sha256, sourceRunSha256: artifact.sourceRun.sha256}
        : {runtimeSha256: artifact.runtime.sha256})};
  }};
  return {catalog: pagesCatalog, profile: read(bridge.G678_SHARED_PROFILE_PATH), freeze, registry,
    selectionAuthorities: freeze.value.inputs.selectionAuthorities.map((pin: any) => read(pin.path)),
    predecessorFileBinding: read(G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path),
    dualPredecessorFileBinding: read(G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path),
    p042PredecessorFreezeFileBinding: priorFreeze, p042BaseCandidateFileBinding: read(G678_P042_BASE.path),
    p042ReadableCandidateFileBinding: read(G678_P042_READABLE.path), priorFreeze, priorFragment, priorRegistry, source, projected};
}

test('378 admission names one exact phase and freeze without changing V2/V3/V4 filenames', () => {
  assert.equal(bridge.G678_CALIBRATION_FREEZE_PATH, PROPOSED_FREEZE);
  assert.equal(bridge.G678_NMS_L01_P042_COMPANION_FREEZE_PATH, PROPOSED_FREEZE);
  assert.equal(bridge.G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH, G678_P042_PREDECESSOR.path);
  for (const path of [G678_P042_PREDECESSOR.path, PROPOSED_FREEZE.replace('378', '379'),
    PROPOSED_FREEZE.replace('-v1.', '-v2.')]) {
    const input = fixture(); input.freeze.path = path;
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /SOURCE_BINDING_INVALID/u);
  }
});

test('actual378 planner projection preserves377 page/entry objects and admits exactly one source-derived page among44 lessons', () => {
  const input = fixture(), before = JSON.stringify(input.freeze), result = bridge.buildG678PartialCalibrationSnapshot(input as never);
  assert.equal(JSON.stringify(input.freeze), before); assert.equal(result.status, 'ready');
  assert.equal(result.registeredPlacementCount, 378); assert.equal(result.runtimeAssets.length, 354);
  assert.equal(result.maintainedDomRenderers.length, 24); assert.equal(result.descriptors.length, 44);
  assert.deepEqual(input.freeze.value.selectedPages.filter((page: any) => page.animationId !== G678_P042_ID), input.priorFreeze.value.selectedPages);
  assert.deepEqual(input.projected.fragment.calibration.entries.filter((entry: any) => entry.key !== G678_P042_ID), input.priorFragment.value.calibration.entries);
  assert.deepEqual(input.projected.nextRegistry.calibrations.filter((c: any) => c.calibrationId !== bridge.G678_CALIBRATION_ID),
    input.priorRegistry.value.calibrations.filter((c: any) => c.calibrationId !== bridge.G678_CALIBRATION_ID));
  assert.equal(result.descriptors.reduce((count, descriptor) => count + descriptor.pages.length, 0), 2282);
  const lesson = result.descriptors.find(d => d.pages.some(p => p.animationId === G678_P042_ID))!;
  assert.equal(lesson.pages.length, 47); assert.equal(lesson.productBridge.registeredAnimationCount, 11);
  const page = lesson.pages.find(page => page.animationId === G678_P042_ID)!;
  assert.equal(page.globalPageOrdinal, 42);
  assert.deepEqual(page.presentation, {pageInteractionCompanionTargetIdSuffix: G678_P042_SUFFIX});
  const selected = input.freeze.value.selectedPages.find((page: any) => page.animationId === G678_P042_ID);
  const {rendererBinding, ...runtime} = selected.runtime;
  assert.deepEqual(runtime, G678_P042_RUNTIME); assert.equal(selected.adapterFamily, G678_P042_FAMILY);
  assert.equal(selected.complexityLane, 'behavior-heavy'); assert.equal(selected.productCalibrationPassed, false);
  assert.equal(selected.engineeringPreviewReady, false); assert.deepEqual(selected.runtime.lessonHostCapabilities, []);
  const actual = result.maintainedDomRenderers.find(renderer => renderer.animationId === G678_P042_ID)!;
  assert.deepEqual(actual.module, input.source.value.entries[0].moduleFile);
  assert.deepEqual(actual.timeline, input.source.value.entries[0].timeline);
  assert.deepEqual(actual.memberManifest, input.source.value.entries[0].memberManifest);
  assert.deepEqual(actual.sourceRun, input.source.value.compilerRun); assert.deepEqual(rendererBinding.sourceRun, actual.sourceRun);
  assert.ok(result.descriptors.every(d => Object.values(d.productBridge.acceptanceEffects).every(value => value === false)));
  assert.equal(result.scaleOutAuthorized, false);
  const alg = result.descriptors.find(d => d.pages.some(p => p.animationId === 'shared-alg001-l11-p034'))!;
  for (const [id, suffix] of Object.entries(G678_MATH_COMPANION_SUFFIXES))
    assert.equal(alg.pages.find(page => page.animationId === id)?.presentation?.pageInteractionCompanionTargetIdSuffix, suffix);
});

test('378 requires base/readable/V4 bindings separately and preserves original902/dual99/companion85 lineage', () => {
  for (const key of ['p042PredecessorFreezeFileBinding', 'p042BaseCandidateFileBinding', 'p042ReadableCandidateFileBinding'] as const) {
    const input = fixture();
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot({...input, [key]: undefined} as never), /P042_EXACT_AUTHORITY_REQUIRED/u);
    const duplicate = fixture(); duplicate.selectionAuthorities.push(duplicate[key]);
    duplicate.freeze.value.inputs.selectionAuthorities.push(descriptor(duplicate[key]));
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(duplicate as never), /P042_EXACT_AUTHORITY_REQUIRED/u);
    const altered = fixture(); altered[key] = {...altered[key], sha256: '0'.repeat(64)};
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(altered as never), /P042_COMPANION_AUTHORITY_INVALID/u);
  }
  for (const key of ['predecessorFileBinding', 'dualPredecessorFileBinding'] as const) {
    const input = fixture();
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot({...input, [key]: undefined} as never), /V4_EXACT_COMPANION_AUTHORITY_REQUIRED/u);
  }
});

test('source authority aliases/duplicates/missing/stale wrappers and acceptance escalation are rejected', () => {
  for (const mutation of ['alias', 'duplicate', 'missing', 'stale', 'accepted']) {
    const input = fixture();
    const authority = input.selectionAuthorities.find((binding: any) => binding.path === G678_P042_AUTHORITY.path)!;
    if (mutation === 'alias') authority.path += '.alias';
    if (mutation === 'duplicate') input.selectionAuthorities.push(authority);
    if (mutation === 'missing') input.selectionAuthorities = input.selectionAuthorities.filter((binding: any) => binding !== authority);
    if (mutation === 'stale') authority.value.entries[0].moduleFile = input.source.value.entries[0].timeline;
    if (mutation === 'accepted') authority.value.productCalibrationPassed = true;
    input.freeze.value.inputs.selectionAuthorities = input.selectionAuthorities.map(descriptor);
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /P042_(?:EXACT_AUTHORITY_REQUIRED|COMPANION_AUTHORITY_INVALID)/u);
  }
});

test('new runtime cannot borrow ALG authority, stale module/run, altered source frames, caps, seeds or timeline controls', () => {
  for (const mutate of [(p: any) => {p.runtime.rootBeginFrame = 1;}, (p: any) => {p.runtime.frameCount = 124;},
    (p: any) => {p.runtime.frameDomain = 'root';}, (p: any) => {p.runtime.seed = '1';},
    (p: any) => {p.runtime.lessonHostCapabilities = ['audio'];},
    (p: any) => {p.runtime.authoredTimelineControls = [{id: 'invented'}];},
    (p: any) => {p.adapterFamily = 'alg-l09-terminal-stop-source-static';},
    (p: any, input: ReturnType<typeof fixture>) => {p.runtime.rendererBinding.sourceRun = input.priorFreeze.value.selectedPages.find((p: any) => p.runtime.rendererBinding)?.runtime.rendererBinding.sourceRun;},
    (p: any, input: ReturnType<typeof fixture>) => {p.runtime.rendererBinding.module = input.priorFreeze.value.selectedPages.find((p: any) => p.runtime.rendererBinding)?.runtime.rendererBinding.module;}]) {
    const input = fixture(); mutate(input.freeze.value.selectedPages.find((p: any) => p.animationId === G678_P042_ID), input);
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /REGISTRATION_INVALID/u);
  }
});

test('all377 predecessor page objects and p042 companion placement remain strict rather than merely matching counts', () => {
  for (const mutate of [(input: ReturnType<typeof fixture>) => {input.freeze.value.selectedPages[0].runtime.seed = '25';},
    (input: ReturnType<typeof fixture>) => {input.freeze.value.selectedPages.reverse();}]) {
    const input = fixture(); mutate(input);
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /all377 prior selected objects and order/u);
  }
  for (const suffix of [undefined, 'alg-l11-p034-math-companion', 'nms-l01-p042-readable-companion-unreviewed']) {
    const input = fixture(), page = input.freeze.value.selectedPages.find((p: any) => p.animationId === G678_P042_ID);
    page.presentation = suffix === undefined ? undefined : {pageInteractionCompanionTargetIdSuffix: suffix};
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /COMPANION_PRESENTATION_INVALID/u);
  }
});

test('new selected-page product gates cannot borrow source packet implementation or isolated candidate QA as acceptance', () => {
  for (const mutate of [(page: any) => {page.productCalibrationPassed = true;},
    (page: any) => {page.engineeringPreviewReady = true;},
    (page: any) => {page.implementation.registeredCompanionProductQaPassed = true;},
    (page: any) => {page.implementation.familyVisualPlaybackCalibrationPassed = true;}]) {
    const input = fixture(); mutate(input.freeze.value.selectedPages.find((page: any) => page.animationId === G678_P042_ID));
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /product-calibration pending/u);
  }
});

test('378 cache keeps separate predecessor/candidate pins once without duplicate selection authority', () => {
  const input = fixture(), paths = bridge.g678CalibrationFingerprintDependencies(input.freeze.value);
  for (const pin of [G678_P042_AUTHORITY, G678_P042_BASE, G678_P042_READABLE, G678_P042_PREDECESSOR,
    G678_MATH_COMPANION_AUTHORITY, G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT, G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT])
    assert.equal(paths.filter(path => path === pin.path).length, 1);
  assert.ok(paths.includes(PROPOSED_FREEZE)); assert.ok(paths.includes(G678_P042_RUN_PATH));
  for (const pin of [G678_P042_BASE, G678_P042_READABLE, G678_P042_PREDECESSOR,
    G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT, G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT])
    assert.equal(input.selectionAuthorities.some((binding: any) => binding.path === pin.path), false);
});

test('378 remains production-closed before any registry or source packet filesystem loading', () => {
  const previous = process.env.NODE_ENV;
  Reflect.set(process.env, 'NODE_ENV', 'production');
  try {
    const snapshot = bridge.g678PartialCalibrationSnapshot();
    assert.equal(snapshot.status, 'production-closed'); assert.equal(snapshot.registeredPlacementCount, 0);
    assert.deepEqual(snapshot.descriptors, []); assert.deepEqual(snapshot.maintainedDomRenderers, []);
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV');
    else Reflect.set(process.env, 'NODE_ENV', previous);
  }
});

test('actual activated378 filesystem snapshot uses registered metadata and canonical physical closure, not test modules', (t) => {
  if (!existsSync(absolute(PROPOSED_FREEZE))) return t.skip('Actual378 preparation/activation has not run; no activation claim.');
  const freeze = read(PROPOSED_FREEZE), registry = read('packages/demos/private-current-js-registry.json');
  const calibration = registry.value.calibrations.find((item: any) => item.calibrationId === bridge.G678_CALIBRATION_ID);
  if (calibration.freezeManifestSha256 !== freeze.sha256)
    return t.skip('Current registry is not378; this mandatory filesystem check must rerun after activation.');
  const snapshot = bridge.g678PartialCalibrationSnapshot();
  assert.equal(snapshot.status, 'ready', snapshot.error ?? 'Actual378 filesystem snapshot must be ready');
  assert.equal(snapshot.error, null); assert.equal(snapshot.registeredPlacementCount, 378);
  assert.equal(snapshot.runtimeAssets.length, 354); assert.equal(snapshot.maintainedDomRenderers.length, 24);
  assert.equal(snapshot.descriptors.length, 44);
  const descriptor = bridge.findG678PartialCalibrationDescriptor(G678_P042_ID)!;
  assert.ok(descriptor); assert.equal(descriptor.pages.length, 47); assert.equal(descriptor.productBridge.registeredAnimationCount, 11);
  assert.equal(descriptor.pages.find(page => page.animationId === G678_P042_ID)?.presentation?.pageInteractionCompanionTargetIdSuffix, G678_P042_SUFFIX);
});
