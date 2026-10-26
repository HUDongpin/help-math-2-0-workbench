import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {composeInstructionalSuccessor, SUCCESSOR_IDS, OUTPUT_FREEZE} from './prepare-g678-alg-l11-instructional-successor-registration.mjs';
const read = file => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url)));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const binding = (path, value) => {
  const bytes = Buffer.from(JSON.stringify(value)); return {path, bytes: bytes.length, sha256: hash(bytes)};
};
function fixture() {
  const priorFreeze = read('catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json');
  const priorFragment = read('catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.fragment.json');
  const priorRegistry = read('catalog/product-bridge-calibrations/g678-provisional377-private-current-js-registry-witness-v1.json');
  const pages = new Map(priorFreeze.selectedPages.map(p => [p.animationId, p]));
  const old = ['interactive10-tranche-c', 'behavior10-tranche-b', 'advanced3-tranche-d']
    .flatMap(name => read(`catalog/product-bridge-calibrations/g678-alg-l11-${name}-current-js-v1.fragment.json`).entries);
  const entries = SUCCESSOR_IDS.map(id => {
    const e = structuredClone(old.find(e => e.key === id));
    const base = `g678-alg-l11-instructional-successor-${id.slice(-4)}`;
    e.module = `./modules/${base}`;
    e.moduleFile.path = `packages/demos/src/modules/${base}.tsx`;
    e.timeline.path = `packages/demos/src/timelines/${base}.ts`;
    e.memberManifest.path = `work/g678-shared-page-factory/test-only-source-run/members/${id}/member-manifest.json`;
    const {rendererBinding, ...runtimeContract} = structuredClone(pages.get(id).runtime);
    return {...e, adapterFamily: pages.get(id).adapterFamily, runtimeContract};
  });
  const sourceFragment = {artifactType: 'g678-alg-l11-instructional-successor-current-js-fragment-v1', entries,
    compilerRun: binding('work/g678-shared-page-factory/test-only-source-run/run-manifest.json', {testFixture: true}),
    acceptanceEffects: {productCalibrationPassed: false, audioAccepted: false, published: false}};
  const bindings = Object.fromEntries(['priorFreeze', 'priorFragment', 'priorRegistry', 'sourceFragment', 'glossary', 'preparer']
    .map(name => [name, binding(`test-only/${name}.json`, {name})]));
  return {priorFreeze, priorFragment, priorRegistry, sourceFragment, glossaryByAnimationId: {}, bindings};
}

test('exact23 successor replaces modules while preserving every other page and registry calibration', () => {
  const input = fixture(), before = structuredClone(input);
  const result = composeInstructionalSuccessor(input);
  assert.deepEqual(input, before, 'Composition mutated predecessor objects');
  assert.equal(result.changedModuleCount, 23); assert.equal(result.preservedPageCount, 354);
  assert.equal(result.freeze.selectedPages.length, 377);
  for (const page of result.freeze.selectedPages.filter(p => !SUCCESSOR_IDS.includes(p.animationId))) {
    assert.deepEqual(page, before.priorFreeze.selectedPages.find(p => p.animationId === page.animationId));
  }
  const current = result.nextRegistry.calibrations.find(c => c.calibrationId === result.freeze.calibrationId);
  const prior = input.priorRegistry.calibrations.find(c => c.calibrationId === result.freeze.calibrationId);
  assert.equal(current.freezeManifest, OUTPUT_FREEZE);
  assert.equal(current.entries.filter(e => e.module !== prior.entries.find(p => p.key === e.key).module).length, 23);
  assert.deepEqual(result.nextRegistry.calibrations.filter(c => c.calibrationId !== result.freeze.calibrationId),
    input.priorRegistry.calibrations.filter(c => c.calibrationId !== result.freeze.calibrationId));
  assert.equal(result.freeze.productCalibrationPassed, false);
  assert.ok(Object.values(result.freeze.acceptanceEffects).every(v => v === false));
});

test('source identity, exact membership, family and actual runtime metadata remain mandatory', () => {
  for (const mutate of [
    f => {f.entries[0].source.sha256 = '0'.repeat(64);},
    f => f.entries.reverse(), f => f.entries.pop(),
    f => {f.entries[0].adapterFamily = 'another-family';},
    f => {delete f.entries[0].runtimeContract;},
    f => {f.entries[0].runtimeContract.frameCount += 1;},
    f => {f.entries[0].productCalibrationPassed = true;},
    f => {f.acceptanceEffects.audioAccepted = true;},
  ]) {
    const input = fixture(); mutate(input.sourceFragment);
    assert.throws(() => composeInstructionalSuccessor(input));
  }
});

test('source glossary projection attaches only to the selected successor placement', () => {
  const input = fixture(), id = SUCCESSOR_IDS[0];
  input.glossaryByAnimationId[id] = [{id: 'test-only-source-bound-term'}];
  const result = composeInstructionalSuccessor(input);
  assert.deepEqual(result.freeze.selectedPages.find(p => p.animationId === id).glossaryEntries,
    input.glossaryByAnimationId[id]);
  assert.equal(result.freeze.productHostCalibration.instructionalSuccessorProductRouteCalibratedCount, 0);
});
