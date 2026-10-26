import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp, mkdir, readFile, writeFile, rm, realpath} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readNmsL3P002Packet, readNmsL3P002Binding, extendNmsL3Descriptor, NMS_L3_P002_ID, NMS_L3_P002_CALIBRATION, NMS_L3_P002_FREEZE} from '../apps/web/lib/g678-nms-l03-p002.server.ts';
import {g678PartialCalibrationSnapshot} from '../apps/web/lib/g678-calibration-product-bridge.server.ts';
import {nmsL3P002Equation} from '../packages/demos/src/timelines/g678-nms-l03-p002-equation.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';

const root = path.resolve(import.meta.dirname, '..');
const packet = readNmsL3P002Packet(root);
const snapshot = g678PartialCalibrationSnapshot();
assert.equal(snapshot.status, 'ready');
const base = snapshot.descriptors.find(d => d.course.moduleCode === 'NMS002' && d.course.lesson === 3);
const registration = {maturity: 'private-current-js', deploymentScope: 'local-only', calibrationId: NMS_L3_P002_CALIBRATION,
  freezeManifestSha256: NMS_L3_P002_FREEZE.sha256, moduleSha256: packet.entry.artifacts.module.sha256,
  timelineSha256: packet.entry.artifacts.timeline.sha256, runtimeSha256: packet.entry.artifacts.runtime.sha256};

test('one registered source placement is added without changing any other lesson occurrence or gate', () => {
  const descriptor = extendNmsL3Descriptor(base, packet, registration);
  assert.equal(descriptor.pages.length, 56);
  assert.equal(descriptor.productBridge.registeredAnimationCount, 4);
  assert.deepEqual(descriptor.productBridge.selectedAnimationIds, [NMS_L3_P002_ID, 'shared-nms002-l03-p025', 'shared-nms002-l03-p051', 'shared-nms002-l03-p055']);
  descriptor.pages.forEach((page, i) => {if (i !== 1) assert.deepEqual(page, base.pages[i]);});
  assert.equal(descriptor.pages[1].previousPlacementId, 'shared-nms002-l03-p001');
  assert.equal(descriptor.pages[1].nextPlacementId, 'shared-nms002-l03-p003');
  assert.equal(descriptor.pages[1].rendererAvailability.runtimeQuery.frameDomain, 'sprite-237');
  assert.equal(descriptor.course.courseShellCount, 0);
  assert(Object.values(descriptor.productBridge.acceptanceEffects).every(v => v === false));
  assert.equal(base.pages[1].rendererAvailability.kind, 'unavailable');
});

test('missing, unbound, public, or differently sourced registrations do not enter the descriptor', () => {
  for (const altered of [undefined, {...registration, deploymentScope: 'bundled'}, {...registration, calibrationId: 'another'},
    {...registration, runtimeSha256: '0'.repeat(64)}, {...registration, moduleSha256: '0'.repeat(64)},
    {...registration, timelineSha256: '0'.repeat(64)}, {...registration, freezeManifestSha256: '0'.repeat(64)}]) {
    assert.throws(() => extendNmsL3Descriptor(base, packet, altered), /actual registered module/);
  }
  for (const mutate of [b => {b.course.lesson = 4;}, b => {b.pages[1].source.assetId = 'swf-' + '0'.repeat(64);},
    b => {b.pages[1].globalPageOrdinal = 3;}, b => {b.source.sourceXmlSha256 = '0'.repeat(64);},
    b => {b.pages[1].rendererAvailability = {kind: 'registered', moduleKey: NMS_L3_P002_ID};}]) {
    const altered = structuredClone(base); mutate(altered);
    assert.throws(() => extendNmsL3Descriptor(altered, packet, registration), /NMS_L3_P002_INVALID/);
  }
});

test('an actual changed renderer byte is rejected before an asset can be served', async () => {
  const temp = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-nms-l3-binding-')));
  try {
    const binding = packet.entry.artifacts.runtime, runtime = path.join(temp, binding.path);
    await mkdir(path.dirname(runtime), {recursive: true});
    const bytes = await readFile(path.join(root, binding.path)); await writeFile(runtime, bytes);
    assert(readNmsL3P002Binding(temp, binding).equals(bytes));
    bytes[100] ^= 1; await writeFile(runtime, bytes);
    assert.throws(() => readNmsL3P002Binding(temp, binding), /input hash/);
  } finally {await rm(temp, {recursive: true, force: true});}
});

test('modern equation preserves the three source operands and question without introducing an answer', () => {
  const state = nmsL3P002Equation(688);
  assert.deepEqual(state.terms, ['2/3', '1/2', '3/4']); assert.equal(state.answer, '?');
  assert.equal(nmsL3P002Equation(625).visible, false);
  assert.equal(nmsL3P002Equation(626).visible, true);
  for (const bad of [0, 689, 1.5, NaN]) assert.throws(() => nmsL3P002Equation(bad), /invalid-nms-l3-source-frame/);
});

test('All Lessons reflects 422 registered pages while retaining the shared grade and locked learner route', () => {
  const shared = allLearningLessons().filter(card => card.moduleCode);
  assert.equal(shared.length, 44);
  assert.equal(shared.reduce((sum, card) => sum + card.registeredPageCount, 0), 422);
  const lesson = shared.find(card => card.stableLessonKey === 'shared-nms002-l03');
  assert.equal(lesson.registeredPageCount, 4); assert.equal(lesson.activePageCount, 56);
  assert.equal(lesson.grade, null); assert.equal(lesson.href, null);
  assert.equal(lesson.mappingStatus, 'pending');
});
