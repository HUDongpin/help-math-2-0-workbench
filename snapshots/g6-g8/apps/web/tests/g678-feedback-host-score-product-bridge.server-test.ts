import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';
import {composeFeedbackHostScoreRegistration, PREDECESSOR_FREEZE,
  PREDECESSOR_FRAGMENT, PREDECESSOR_REGISTRY_WITNESS, COMPOSITE}
  from '../../../scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs';
import {G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT}
  from '../lib/g678-instructional-behavior-delta-authority.server';
import {G678_MATH_COMPANION_AUTHORITY}
  from '../lib/g678-math-companion-authority.server';

process.env.HELP_MATH_G678_CALIBRATION_PHASE = 'alg-l11-feedback-host-score-successor-provisional-browser-qa';
const bridge = await import('../lib/g678-calibration-product-bridge.server');
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const read = (path: string) => {
  const bytes = readFileSync(new URL(`../../../${path}`, import.meta.url));
  return {path, bytes: bytes.length, sha256: hash(bytes), value: JSON.parse(bytes.toString('utf8'))};
};
const bind = (path: string, value: any) => {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n');
  return {path, bytes: bytes.length, sha256: hash(bytes), value};
};
const descriptor = ({path, bytes, sha256}: ReturnType<typeof read>) => ({path, bytes, sha256});

// Actual v3 projection in memory only. No freeze, witness or registry write.
function fixture() {
  const priorFreeze = read(PREDECESSOR_FREEZE.path), priorFragment = read(PREDECESSOR_FRAGMENT.path);
  const registryPath = existsSync(new URL(`../../../${PREDECESSOR_REGISTRY_WITNESS}`, import.meta.url))
    ? PREDECESSOR_REGISTRY_WITNESS : 'packages/demos/private-current-js-registry.json';
  const composite = read(COMPOSITE.path);
  const preparerPath = 'scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs';
  const preparerBytes = readFileSync(new URL(`../../../${preparerPath}`, import.meta.url));
  const prepared = composeFeedbackHostScoreRegistration({priorFreeze: priorFreeze.value,
    priorFragment: priorFragment.value, priorRegistry: read(registryPath).value,
    composite: composite.value, preparerBinding: {path: preparerPath, bytes: preparerBytes.length, sha256: hash(preparerBytes)}});
  const freeze = bind(bridge.G678_ALG_L11_FEEDBACK_HOST_SCORE_SUCCESSOR_FREEZE_PATH, prepared.freeze);
  const entries = new Map(prepared.fragment.calibration.entries.map((entry: any) => [entry.key, entry]));
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
  return {catalog: read(bridge.G678_SHARED_CATALOG_PATH), profile: read(bridge.G678_SHARED_PROFILE_PATH),
    freeze, registry, selectionAuthorities: freeze.value.inputs.selectionAuthorities.map((a: any) => read(a.path)),
    predecessorFileBinding: read(G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path), composite};
}

test('exact v3 phase does not redefine v2 or admit an arbitrary future filename', () => {
  assert.equal(bridge.G678_CALIBRATION_FREEZE_PATH,
    'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.json');
  assert.notEqual(bridge.G678_CALIBRATION_FREEZE_PATH, bridge.G678_ALG_L11_INSTRUCTIONAL_SUCCESSOR_FREEZE_PATH);
  const input = fixture(); input.freeze.path = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.json';
  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /SOURCE_BINDING_INVALID/u);
});

test('actual in-memory v3 projects354 canvas+23 DOM with only p034/p044 sourceRun overrides', () => {
  const input = fixture(), result = bridge.buildG678PartialCalibrationSnapshot(input as never);
  assert.equal(result.status, 'ready'); assert.equal(result.registeredPlacementCount, 377);
  assert.equal(result.runtimeAssets.length, 354); assert.equal(result.maintainedDomRenderers.length, 23);
  assert.equal(result.descriptors.length, 44);
  const byId = new Map(result.maintainedDomRenderers.map(member => [member.animationId, member]));
  assert.deepEqual(byId.get('shared-alg001-l11-p034')?.sourceRun, input.composite.value.p034CompilerRun);
  assert.deepEqual(byId.get('shared-alg001-l11-p044')?.sourceRun, input.composite.value.p044CompilerRun);
  assert.equal(result.maintainedDomRenderers.filter(member => member.sourceRun.sha256 === input.composite.value.compilerRun.sha256).length, 21);
  for (const entry of input.composite.value.entries) {
    const actual = byId.get(entry.key)!;
    assert.deepEqual(actual.module, entry.moduleFile); assert.deepEqual(actual.timeline, entry.timeline);
    assert.deepEqual(actual.memberManifest, entry.memberManifest);
  }
  const lesson = result.descriptors.find(d => d.pages.some(p => p.animationId === 'shared-alg001-l11-p034'))!;
  assert.equal(lesson.pages.length, 44); assert.equal(lesson.productBridge.registeredAnimationCount, 44);
  assert.equal(lesson.glossary?.length, 43);
  assert.deepEqual(lesson.support.lessonHostCapabilities, ['glossary', 'navigation', 'practice-feedback', 'fq-scoring']);
  assert.ok(Object.values(lesson.productBridge.acceptanceEffects).every(value => value === false));
});

test('predecessor is a separate required binding and cannot become a duplicate selection authority', () => {
  const input = fixture();
  assert.equal(input.selectionAuthorities.some((a: any) => a.path === G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path), false);
  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot({...input, predecessorFileBinding: undefined} as never),
    /V3_EXACT_DUAL_AUTHORITY_REQUIRED/u);
  const altered = {...input.predecessorFileBinding, value: {entries: []}};
  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot({...input, predecessorFileBinding: altered} as never),
    /BEHAVIOR_DELTA_INVALID/u);
  const duplicate = fixture();
  duplicate.selectionAuthorities.push(duplicate.predecessorFileBinding);
  duplicate.freeze.value.inputs.selectionAuthorities.push(descriptor(duplicate.predecessorFileBinding));
  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(duplicate as never), /V3_EXACT_DUAL_AUTHORITY_REQUIRED/u);
});

test('exact v3 requires dual authority, not the old unified authority or a same-bytes alias', () => {
  const input = fixture();
  const old = input.predecessorFileBinding;
  input.selectionAuthorities = input.selectionAuthorities.map((a: any) => a.path === COMPOSITE.path ? old : a);
  input.freeze.value.inputs.selectionAuthorities = input.selectionAuthorities.map(descriptor);
  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /V3_EXACT_DUAL_AUTHORITY_REQUIRED/u);
  const aliased = fixture(), aliasPath = 'catalog/product-bridge-calibrations/test-only-dual-alias.json';
  const alias = {...aliased.composite, path: aliasPath};
  aliased.selectionAuthorities = aliased.selectionAuthorities.map((a: any) => a.path === COMPOSITE.path ? alias : a);
  aliased.freeze.value.inputs.selectionAuthorities = aliased.selectionAuthorities.map(descriptor);
  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(aliased as never), /V3_EXACT_DUAL_BINDING_REQUIRED/u);
});

test('stale wrapper/new member mix and crossed runs or added audio cannot bypass exact dual canonical pin', () => {
  for (const mutate of [(v: any, old: any) => {
    const entry = v.entries.find((e: any) => e.key.endsWith('p034'));
    const prior = old.entries.find((e: any) => e.key.endsWith('p034'));
    entry.module = prior.module; entry.moduleFile = prior.moduleFile; entry.timeline = prior.timeline;
  }, (v: any) => {v.p034CompilerRun = v.p044CompilerRun;},
  (v: any) => {v.entries.find((e: any) => e.key.endsWith('p044')).runtimeContract.lessonHostCapabilities.push('audio');}]) {
    const input = fixture();
    const authority = input.selectionAuthorities.find((a: any) => a.path === COMPOSITE.path);
    mutate(authority.value, input.predecessorFileBinding.value);
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /BEHAVIOR_DELTA_INVALID/u);
  }
});

test('registered runtime or artifact crossing is rejected even with unchanged exact authority', () => {
  for (const mutate of [(page: any) => {page.runtime.lessonHostCapabilities = [];},
    (page: any) => {page.runtime.rendererBinding.sourceRun = page.runtime.rendererBinding.module;},
    (page: any) => {page.runtime.interactiveStops[0].rendererStateOnResume = 'reset';}]) {
    const input = fixture(); mutate(input.freeze.value.selectedPages.find((page: any) => page.animationId === 'shared-alg001-l11-p034'));
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /REGISTRATION_INVALID/u);
  }
});

test('v3 cache fingerprint depends on the separately loaded predecessor without duplicate authority admission', () => {
  const input = fixture();
  const dependencies = bridge.g678CalibrationFingerprintDependencies(input.freeze.value);
  assert.equal(dependencies.filter(p => p === G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path).length, 1);
  assert.ok(dependencies.includes(COMPOSITE.path));
  assert.ok(dependencies.includes(bridge.G678_ALG_L11_FEEDBACK_HOST_SCORE_SUCCESSOR_FREEZE_PATH));
  assert.ok(bridge.g678CalibrationFingerprintDependencies().includes(G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path));
  assert.equal(input.selectionAuthorities.length, input.freeze.value.inputs.selectionAuthorities.length);
});

test('preserved V3 cannot admit V4 companion authority or its extra dual predecessor parameter', () => {
  const extra = fixture();
  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot({...extra,
    dualPredecessorFileBinding: extra.composite} as never), /V3_EXACT_DUAL_AUTHORITY_REQUIRED/u);
  const input = fixture(), companion = read(G678_MATH_COMPANION_AUTHORITY.path);
  input.selectionAuthorities = input.selectionAuthorities.map((a: any) => a.path === COMPOSITE.path ? companion : a);
  input.freeze.value.inputs.selectionAuthorities = input.selectionAuthorities.map(descriptor);
  assert.throws(() => bridge.buildG678PartialCalibrationSnapshot({...input,
    dualPredecessorFileBinding: input.composite} as never), /V3_EXACT_DUAL_AUTHORITY_REQUIRED/u);
  assert.equal(bridge.g678CalibrationFingerprintDependencies(input.freeze.value)
    .includes(COMPOSITE.path), false, 'V3 must not load the V4-only separate dual binding');
});
