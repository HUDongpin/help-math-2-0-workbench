import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {ROOT, REGISTRY, CALIBRATION_ID, PREDECESSOR_REGISTRY_WITNESS, PREDECESSOR_REGISTRY,
  PREDECESSOR_FREEZE, PREDECESSOR_FRAGMENT, COMPOSITE, OUTPUT_FREEZE, OUTPUT_FRAGMENT, CHANGED_IDS,
  encode, binding, composeFeedbackHostScoreRegistration, publishV3Preparation}
  from './prepare-g678-alg-l11-feedback-host-score-registration.mjs';
const read = file => readFileSync(path.join(ROOT, file));
function fixture() {
  return {priorFreeze: JSON.parse(read(PREDECESSOR_FREEZE.path)), priorFragment: JSON.parse(read(PREDECESSOR_FRAGMENT.path)),
    priorRegistry: JSON.parse(read(existsSync(path.join(ROOT, PREDECESSOR_REGISTRY_WITNESS)) ? PREDECESSOR_REGISTRY_WITNESS : REGISTRY)),
    composite: JSON.parse(read(COMPOSITE.path)), preparerBinding: binding('scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs',
      read('scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs'))};
}
test('v3 preparation replaces exactly2 modules/runtime bindings and preserves375 complete page objects, artifacts and other calibrations', () => {
  const input = fixture(), before = structuredClone(input), result = composeFeedbackHostScoreRegistration(input);
  assert.deepEqual(input, before); assert.equal(result.changedModuleCount, 2); assert.equal(result.preservedPageCount, 375);
  const unchanged = pages => pages.filter(p => !CHANGED_IDS.includes(p.animationId));
  assert.deepEqual(unchanged(result.freeze.selectedPages), unchanged(input.priorFreeze.selectedPages));
  const previous = input.priorRegistry.calibrations.find(c => c.calibrationId === CALIBRATION_ID);
  const next = result.nextRegistry.calibrations.find(c => c.calibrationId === CALIBRATION_ID);
  assert.equal(next.entries.length, 377); assert.equal(next.freezeManifest, OUTPUT_FREEZE);
  assert.deepEqual(next.entries.filter(e => !CHANGED_IDS.includes(e.key)), previous.entries.filter(e => !CHANGED_IDS.includes(e.key)));
  assert.deepEqual(next.entries.filter((e, i) => e.module !== previous.entries[i].module).map(e => e.key), CHANGED_IDS);
  assert.deepEqual(result.nextRegistry.calibrations.filter(c => c.calibrationId !== CALIBRATION_ID), input.priorRegistry.calibrations.filter(c => c.calibrationId !== CALIBRATION_ID));
  for (const [index, id] of CHANGED_IDS.entries()) {
    const expectedRun = index === 0 ? input.composite.p034CompilerRun : input.composite.p044CompilerRun;
    assert.deepEqual(next.entries.find(e => e.key === id).artifacts.sourceRun, expectedRun);
  }
  for (const entry of next.entries.filter(e => e.key.startsWith('shared-alg001-l11-') && !CHANGED_IDS.includes(e.key) && e.artifacts.kind === 'maintained-dom-module-v1'))
    assert.deepEqual(entry.artifacts.sourceRun, input.composite.compilerRun);
});
test('one source authority is replaced; typed host completion never promotes My Lesson, audio, accessibility or acceptance', () => {
  const input = fixture(), result = composeFeedbackHostScoreRegistration(input);
  const oldAuthorities = input.priorFreeze.inputs.selectionAuthorities, newAuthorities = result.freeze.inputs.selectionAuthorities;
  assert.equal(newAuthorities.length, oldAuthorities.length);
  assert.equal(newAuthorities.filter((a, i) => JSON.stringify(a) !== JSON.stringify(oldAuthorities[i])).length, 1);
  assert.ok(newAuthorities.some(a => a.sha256 === COMPOSITE.sha256));
  const p034 = result.freeze.selectedPages.find(p => p.animationId === CHANGED_IDS[0]);
  const p044 = result.freeze.selectedPages.find(p => p.animationId === CHANGED_IDS[1]);
  assert.equal(p034.implementation.typedPracticeFeedbackHostImplemented, true);
  assert.equal(p044.implementation.typedFinalQuizScoreHostImplemented, true);
  assert.ok(p034.productBlockers.includes('mobile-mathematical-card-readability-and-text-alternatives-pending'));
  assert.ok(p034.productBlockers.some(value => value.includes('audio-delivery-pause-resume')));
  assert.ok(p044.productBlockers.includes('typed-memory-host-fq-score-reset-and-review-my-lesson-product-qa-pending'));
  assert.ok(!p044.productBlockers.includes('typed-memory-host-fq-score-and-reset-not-implemented'));
  for (const page of [p034, p044]) {
    assert.equal(page.productCalibrationPassed, false); assert.equal(page.engineeringPreviewReady, false);
    assert.equal(page.instructionalHostSuccessor.registryEntryReplacementPrepared, true);
    assert.equal(page.instructionalHostSuccessor.productRouteCalibrationPassed, false);
  }
  assert.equal(result.freeze.productHostCalibration.feedbackHostScoreProductRouteCalibratedCount, 0);
  assert.equal(result.freeze.productCalibrationPassed, false);
  assert.ok(Object.values(result.freeze.acceptanceEffects).every(value => value === false));
});
test('immutable v2 inputs and exact composite are mandatory', () => {
  for (const mutate of [
    f => {f.priorFreeze.selectedPages[0].unexpected = true;},
    f => {f.priorFragment.calibration.entries.pop();},
    f => {f.priorRegistry.calibrations[0].unexpected = true;},
    f => {f.composite.p044CompilerRun.sha256 = '0'.repeat(64);},
    f => {f.composite.entries.find(e => e.key === CHANGED_IDS[0]).runtimeContract.lessonHostCapabilities.push('audio');},
    f => {f.composite.productCalibrationPassed = true;},
  ]) {const input = fixture(); mutate(input); assert.throws(() => composeFeedbackHostScoreRegistration(input));}
});
async function temporary(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-v3-prepare-test-')));
  t.after(() => rm(root, {recursive: true, force: true}));
  await mkdir(path.dirname(path.join(root, PREDECESSOR_FREEZE.path)), {recursive: true});
  await writeFile(path.join(root, PREDECESSOR_FREEZE.path), read(PREDECESSOR_FREEZE.path), {flag: 'wx'});
  const input = fixture(), result = composeFeedbackHostScoreRegistration(input), witnessBytes = encode(input.priorRegistry);
  return {root, result, witnessBytes};
}
async function snapshot(root, prefix = '') {
  const rows = [];
  for (const entry of await readdir(path.join(root, prefix), {withFileTypes: true})) {
    const file = path.join(prefix, entry.name);
    if (entry.isDirectory()) rows.push(...await snapshot(root, file));
    else {const stat = await lstat(path.join(root, file), {bigint: true}); rows.push({...binding(file, await readFile(path.join(root, file))),
      ino: String(stat.ino), mode: String(stat.mode), mtimeNs: String(stat.mtimeNs)});}
  } return rows.sort((a, b) => a.path.localeCompare(b.path));
}
test('future preparation exclusively writes witness+freeze+fragment; two checks are zero-write and do not need a live registry', async t => {
  const f = await temporary(t); assert.equal(await publishV3Preparation(f), 3);
  assert.deepEqual(binding(PREDECESSOR_REGISTRY_WITNESS, await readFile(path.join(f.root, PREDECESSOR_REGISTRY_WITNESS))), PREDECESSOR_REGISTRY);
  const before = await snapshot(f.root); assert.equal(before.length, 4);
  for (let i = 0; i < 2; i++) assert.equal(await publishV3Preparation({...f, check: true}), 0);
  assert.deepEqual(await snapshot(f.root), before);
  await assert.rejects(publishV3Preparation(f), /Exclusive v3 output exists/);
  assert.deepEqual(await snapshot(f.root), before);
  await assert.rejects(lstat(path.join(f.root, REGISTRY)), {code: 'ENOENT'});
});
test('existing exact witness can be reused without overwrite; output conflict prevents creating a witness', async t => {
  const f = await temporary(t); await writeFile(path.join(f.root, PREDECESSOR_REGISTRY_WITNESS), f.witnessBytes, {flag: 'wx', mode: 0o444});
  assert.equal(await publishV3Preparation(f), 2);
  const other = await temporary(t);
  await writeFile(path.join(other.root, OUTPUT_FRAGMENT), 'existing fragment canary\n', {flag: 'wx'});
  const before = await snapshot(other.root);
  await assert.rejects(publishV3Preparation(other), /Exclusive v3 output exists/);
  assert.deepEqual(await snapshot(other.root), before);
  await assert.rejects(lstat(path.join(other.root, PREDECESSOR_REGISTRY_WITNESS)), {code: 'ENOENT'});
});
