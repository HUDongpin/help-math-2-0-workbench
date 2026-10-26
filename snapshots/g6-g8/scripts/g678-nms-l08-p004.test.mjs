import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp, mkdir, readFile, writeFile, rm, realpath} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readNmsL8P004Packet, readNmsL8P004Binding, extendNmsL8Descriptor, NMS_L8_P004_ID, NMS_L8_P004_CALIBRATION, NMS_L8_P004_FREEZE} from '../apps/web/lib/g678-nms-l08-p004.server.ts';
import {g678PartialCalibrationSnapshot} from '../apps/web/lib/g678-calibration-product-bridge.server.ts';
import {composeStageMatrix} from './lib/g678-terminal-source-generator-v4.mjs';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';

const root = path.resolve(import.meta.dirname, '..');
const packet = readNmsL8P004Packet(root);
const snapshot = g678PartialCalibrationSnapshot();
assert.equal(snapshot.status, 'ready');
const base = snapshot.descriptors.find(d => d.course.moduleCode === 'NMS002' && d.course.lesson === 8);
const registration = {maturity: 'private-current-js', deploymentScope: 'local-only', calibrationId: NMS_L8_P004_CALIBRATION,
  freezeManifestSha256: NMS_L8_P004_FREEZE.sha256, moduleSha256: packet.entry.artifacts.module.sha256,
  timelineSha256: packet.entry.artifacts.timeline.sha256, runtimeSha256: packet.entry.artifacts.runtime.sha256};

test('one registered source placement is added without changing any other lesson occurrence or gate', () => {
  const descriptor = extendNmsL8Descriptor(base, packet, registration);
  assert.equal(descriptor.pages.length, 60);
  assert.equal(descriptor.productBridge.registeredAnimationCount, base.productBridge.registeredAnimationCount + 1);
  assert.deepEqual(descriptor.productBridge.selectedAnimationIds, descriptor.pages.filter(p => p.rendererAvailability.kind === 'registered').map(p => p.animationId));
  descriptor.pages.forEach((page, i) => {if (i !== 3) assert.deepEqual(page, base.pages[i]);});
  assert.equal(descriptor.pages[3].previousPlacementId, 'shared-nms002-l08-p003');
  assert.equal(descriptor.pages[3].nextPlacementId, 'shared-nms002-l08-p005');
  assert.equal(descriptor.pages[3].rendererAvailability.runtimeQuery.frameDomain, 'sprite-204');
  assert.equal(descriptor.course.courseShellCount, 0);
  assert(Object.values(descriptor.productBridge.acceptanceEffects).every(v => v === false));
  assert.equal(base.pages[3].rendererAvailability.kind, 'unavailable');
});

test('missing, unbound, public, or differently sourced registrations do not enter the descriptor', () => {
  for (const altered of [undefined, {...registration, deploymentScope: 'bundled'}, {...registration, calibrationId: 'another'},
    {...registration, runtimeSha256: '0'.repeat(64)}, {...registration, moduleSha256: '0'.repeat(64)},
    {...registration, timelineSha256: '0'.repeat(64)}, {...registration, freezeManifestSha256: '0'.repeat(64)}]) {
    assert.throws(() => extendNmsL8Descriptor(base, packet, altered), /actual registered module/);
  }
  for (const mutate of [b => {b.course.lesson = 7;}, b => {b.pages[3].source.assetId = 'swf-' + '0'.repeat(64);},
    b => {b.pages[3].globalPageOrdinal = 3;}, b => {b.source.sourceXmlSha256 = '0'.repeat(64);},
    b => {b.pages[3].rendererAvailability = {kind: 'registered', moduleKey: NMS_L8_P004_ID};}]) {
    const altered = structuredClone(base); mutate(altered);
    assert.throws(() => extendNmsL8Descriptor(altered, packet, registration), /NMS_L8_P004_INVALID/);
  }
});

test('an actual changed renderer byte is rejected before an asset can be served', async () => {
  const temp = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-nms-l3-binding-')));
  try {
    const binding = packet.entry.artifacts.runtime, runtime = path.join(temp, binding.path);
    await mkdir(path.dirname(runtime), {recursive: true});
    const bytes = await readFile(path.join(root, binding.path)); await writeFile(runtime, bytes);
    assert(readNmsL8P004Binding(temp, binding).equals(bytes));
    bytes[100] ^= 1; await writeFile(runtime, bytes);
    assert.throws(() => readNmsL8P004Binding(temp, binding), /input hash/);
  } finally {await rm(temp, {recursive: true, force: true});}
});

test('root translation and the source audio opening remain exact', () => {
  const m = composeStageMatrix({a:1,b:0,c:0,d:1,tx:360.95,ty:273},{x:300,y:200});
  assert.deepEqual(m,{a:1,b:0,c:0,d:1,e:60.94999999999999,f:73});
  assert.equal(packet.audioPlan.audioFirstFrame,10);assert.equal(packet.audioPlan.lastFrame,1557);
});

test('All Lessons reflects 422 registered pages while retaining the shared grade and locked learner route', () => {
  const shared = allLearningLessons().filter(card => card.moduleCode);
  assert.equal(shared.length, 44);
  assert.equal(shared.reduce((sum, card) => sum + card.registeredPageCount, 0), 422);
  const lesson = shared.find(card => card.stableLessonKey === 'shared-nms002-l08');
  assert.equal(lesson.registeredPageCount, base.productBridge.registeredAnimationCount + 1); assert.equal(lesson.activePageCount, 60);
  assert.equal(lesson.grade, null); assert.equal(lesson.href, null);
  assert.equal(lesson.mappingStatus, 'pending');
});
