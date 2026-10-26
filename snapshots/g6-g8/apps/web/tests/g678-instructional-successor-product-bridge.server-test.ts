import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

process.env.HELP_MATH_G678_CALIBRATION_PHASE = 'alg-l11-instructional-successor-provisional-browser-qa';
const bridge = await import('../lib/g678-calibration-product-bridge.server');
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const bind = (path: string, value: any) => {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n');
  return {path, bytes: bytes.length, sha256: hash(bytes), value};
};
const read = (path: string) => {
  const bytes = readFileSync(new URL(`../../../${path}`, import.meta.url));
  return {path, bytes: bytes.length, sha256: hash(bytes), value: JSON.parse(bytes.toString())};
};
const descriptor = ({path, bytes, sha256}: ReturnType<typeof bind>) => ({path, bytes, sha256});

// Pure projection fixture only. It deliberately reuses old bound module bytes
// to test the new authority graph; it is never persisted as product evidence.
function fixture() {
  const old = read('catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json');
  const value = structuredClone(old.value);
  const authorities = value.inputs.selectionAuthorities.map((item: {path: string}) => read(item.path));
  const tranches = authorities.filter((item: ReturnType<typeof read>) => item.value.artifactType?.includes('unregistered-current-js-fragment'));
  assert.equal(tranches.length, 3);
  const byId = new Map(value.selectedPages.map((p: any) => [p.animationId, p]));
  const entries = tranches.flatMap((item: ReturnType<typeof read>) => item.value.entries)
    .sort((a: any, b: any) => a.key.localeCompare(b.key))
    .map((entry: any) => {
      const page = byId.get(entry.key) as any;
      const {rendererBinding, ...runtimeContract} = structuredClone(page.runtime);
      return {...entry, adapterFamily: page.adapterFamily, runtimeContract};
    });
  const unified = bind('catalog/product-bridge-calibrations/test-only-instructional-successor.fragment.json', {
    ...tranches[0].value, artifactType: 'g678-alg-l11-instructional-successor-current-js-fragment-v1',
    exactPlacementCount: 23, generatedPlacementCount: 23, entries,
  });
  for (const entry of entries) (byId.get(entry.key) as any).runtime.rendererBinding.sourceRun = unified.value.compilerRun;
  const retained = authorities.filter((item: ReturnType<typeof read>) => !tranches.includes(item));
  const selectionAuthorities = [...retained, unified];
  value.inputs.selectionAuthorities = selectionAuthorities.map(descriptor);
  const freeze = bind(bridge.G678_ALG_L11_INSTRUCTIONAL_SUCCESSOR_FREEZE_PATH, value);
  const oldEntries = new Map(read('catalog/product-bridge-calibrations/g678-provisional377-private-current-js-registry-witness-v1.json').value.calibrations
    .flatMap((c: any) => c.entries).map((e: any) => [e.key, e]));
  const registry = {
    hasModule: (id: string) => byId.has(id),
    registrationFor: (id: string) => {
      const page = byId.get(id) as any;
      if (!page) return undefined;
      const binding = page.runtime.rendererBinding;
      const oldArtifacts = (oldEntries.get(id) as any).artifacts;
      return {scope: 'private-engineering', maturity: 'private-current-js', deploymentScope: 'local-only',
        calibrationId: bridge.G678_CALIBRATION_ID, freezeManifestSha256: freeze.sha256,
        moduleSha256: oldArtifacts.module.sha256, timelineSha256: oldArtifacts.timeline.sha256,
        ...(binding ? {rendererBindingKind: 'maintained-dom-module-v1', moduleSha256: binding.module.sha256,
          timelineSha256: binding.timeline.sha256, memberManifestSha256: binding.memberManifest.sha256,
          sourceRunSha256: binding.sourceRun.sha256} : {runtimeSha256: page.runtime.canvasRenderer.sha256})};
    },
  };
  return {catalog: read(bridge.G678_SHARED_CATALOG_PATH), profile: read(bridge.G678_SHARED_PROFILE_PATH),
    freeze, registry, selectionAuthorities, unified};
}

test('new successor phase is exact and does not redefine the preserved provisional377 path', () => {
  assert.equal(bridge.G678_CALIBRATION_FREEZE_PATH, bridge.G678_ALG_L11_INSTRUCTIONAL_SUCCESSOR_FREEZE_PATH);
  assert.notEqual(bridge.G678_CALIBRATION_FREEZE_PATH, bridge.G678_ALG_L11_REMAINING23_PROVISIONAL_CALIBRATION_FREEZE_PATH);
});

test('unified source-ordered successor projects 23 DOM members without changing 354 canvas members', () => {
  const input = fixture();
  const result = bridge.buildG678PartialCalibrationSnapshot(input as never);
  assert.equal(result.registeredPlacementCount, 377);
  assert.equal(result.runtimeAssets.length, 354);
  assert.equal(result.maintainedDomRenderers.length, 23);
  assert.equal(result.descriptors.length, 44);
  const lesson = result.descriptors.find(d => d.productBridge.selectedAnimationIds.includes('shared-alg001-l11-p006'));
  assert.equal(lesson?.pages.length, 44);
  assert.equal(lesson?.productBridge.registeredAnimationCount, 44);
});

test('unified successor rejects misordered membership and crossed family bindings', () => {
  for (const mutate of [(value: any) => value.entries.reverse(),
    (value: any) => {value.entries[0].adapterFamily = 'alg-l11-behavior10-tranche-b-maintained-dom';}]) {
    const input = fixture();
    mutate(input.unified.value);
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never),
      /G678_CALIBRATION_ALG_L11_MAINTAINED_DOM_(AUTHORITY|ENTRY)_INVALID/u);
  }
});

test('new source authority rejects an old scenario or altered source hash despite matching artifact hashes', () => {
  for (const mutate of [(page: any) => {page.runtime.scenario = 'wrong-predecessor-scenario';},
    (page: any) => {page.sourceSha256 = '0'.repeat(64);},
    (page: any) => {page.runtime.reducedMotionFrame = 1;}]) {
    const input = fixture();
    mutate(input.freeze.value.selectedPages.find((p: any) => p.animationId === 'shared-alg001-l11-p009'));
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never),
      /G678_CALIBRATION_REGISTRATION_INVALID/u);
  }
});

test('actual prepared successor bytes project 44 source-ordered L11 pages and 43 source-exact glossary terms', () => {
  const freeze = read(bridge.G678_ALG_L11_INSTRUCTIONAL_SUCCESSOR_FREEZE_PATH);
  const fragment = read('catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.fragment.json');
  assert.deepEqual(fragment.value.freeze, descriptor(freeze));
  const entries = new Map(fragment.value.calibration.entries.map((entry: any) => [entry.key, entry]));
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
  const result = bridge.buildG678PartialCalibrationSnapshot({catalog: read(bridge.G678_SHARED_CATALOG_PATH),
    profile: read(bridge.G678_SHARED_PROFILE_PATH), freeze, registry,
    selectionAuthorities: freeze.value.inputs.selectionAuthorities.map((a: any) => read(a.path))} as never);
  assert.equal(result.registeredPlacementCount, 377);
  assert.equal(result.runtimeAssets.length, 354); assert.equal(result.maintainedDomRenderers.length, 23);
  const lesson = result.descriptors.find(d => d.pages.some(p => p.animationId === 'shared-alg001-l11-p006'))!;
  assert.deepEqual(lesson.pages.map(p => p.globalPageOrdinal), Array.from({length: 44}, (_, i) => i + 1));
  assert.equal(lesson.glossary?.length, 43);
  const p009 = lesson.pages.find(p => p.animationId === 'shared-alg001-l11-p009')!;
  assert.equal(p009.rendererAvailability.kind, 'registered');
  if (p009.rendererAvailability.kind === 'registered') {
    assert.equal(p009.rendererAvailability.runtimeQuery?.scenario, 'source-static-frame');
  }
  assert.ok(Object.values(lesson.productBridge.acceptanceEffects).every(v => v === false));
});
