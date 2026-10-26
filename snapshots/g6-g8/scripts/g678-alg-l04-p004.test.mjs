import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp, mkdir, readFile, writeFile, rm, realpath} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readAlgL4P004Packet, readAlgL4P004Binding, extendAlgL4Descriptor, ALG_L4_P004_ID, ALG_L4_P004_CALIBRATION, ALG_L4_P004_FREEZE} from '../apps/web/lib/g678-alg-l04-p004.server.ts';
import {g678PartialCalibrationSnapshot} from '../apps/web/lib/g678-calibration-product-bridge.server.ts';
import {composeStageMatrix} from './lib/g678-terminal-source-generator-v4.mjs';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';

const root = path.resolve(import.meta.dirname, '..');
const packet = readAlgL4P004Packet(root);
const snapshot = g678PartialCalibrationSnapshot();
assert.equal(snapshot.status, 'ready');
const base = snapshot.descriptors.find(d => d.course.moduleCode === 'ALG001' && d.course.lesson === 4);
const registration = {maturity: 'private-current-js', deploymentScope: 'local-only', calibrationId: ALG_L4_P004_CALIBRATION,
  freezeManifestSha256: ALG_L4_P004_FREEZE.sha256, moduleSha256: packet.entry.artifacts.module.sha256,
  timelineSha256: packet.entry.artifacts.timeline.sha256, runtimeSha256: packet.entry.artifacts.runtime.sha256};

test('one registered source placement is added without changing any other lesson occurrence or gate', () => {
  const descriptor = extendAlgL4Descriptor(base, packet, registration);
  assert.equal(descriptor.pages.length, 53);
  assert.equal(descriptor.productBridge.registeredAnimationCount, base.productBridge.registeredAnimationCount + 1);
  assert.deepEqual(descriptor.productBridge.selectedAnimationIds, descriptor.pages.filter(p => p.rendererAvailability.kind === 'registered').map(p => p.animationId));
  descriptor.pages.forEach((page, i) => {if (i !== 3) assert.deepEqual(page, base.pages[i]);});
  assert.equal(descriptor.pages[3].previousPlacementId, 'shared-alg001-l04-p003');
  assert.equal(descriptor.pages[3].nextPlacementId, 'shared-alg001-l04-p005');
  assert.equal(descriptor.pages[3].rendererAvailability.runtimeQuery.frameDomain, 'sprite-38');
  assert.equal(descriptor.course.courseShellCount, 0);
  assert(Object.values(descriptor.productBridge.acceptanceEffects).every(v => v === false));
  assert.equal(base.pages[3].rendererAvailability.kind, 'unavailable');
});

test('missing, unbound, public, or differently sourced registrations do not enter the descriptor', () => {
  for (const altered of [undefined, {...registration, deploymentScope: 'bundled'}, {...registration, calibrationId: 'another'},
    {...registration, runtimeSha256: '0'.repeat(64)}, {...registration, moduleSha256: '0'.repeat(64)},
    {...registration, timelineSha256: '0'.repeat(64)}, {...registration, freezeManifestSha256: '0'.repeat(64)}]) {
    assert.throws(() => extendAlgL4Descriptor(base, packet, altered), /actual registered module/);
  }
  for (const mutate of [b => {b.course.lesson = 7;}, b => {b.pages[3].source.assetId = 'swf-' + '0'.repeat(64);},
    b => {b.pages[3].globalPageOrdinal = 3;}, b => {b.source.sourceXmlSha256 = '0'.repeat(64);},
    b => {b.pages[3].rendererAvailability = {kind: 'registered', moduleKey: ALG_L4_P004_ID};}]) {
    const altered = structuredClone(base); mutate(altered);
    assert.throws(() => extendAlgL4Descriptor(altered, packet, registration), /ALG_L4_P004_INVALID/);
  }
});

test('an actual changed renderer byte is rejected before an asset can be served', async () => {
  const temp = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-nms-l3-binding-')));
  try {
    const binding = packet.entry.artifacts.runtime, runtime = path.join(temp, binding.path);
    await mkdir(path.dirname(runtime), {recursive: true});
    const bytes = await readFile(path.join(root, binding.path)); await writeFile(runtime, bytes);
    assert(readAlgL4P004Binding(temp, binding).equals(bytes));
    bytes[100] ^= 1; await writeFile(runtime, bytes);
    assert.throws(() => readAlgL4P004Binding(temp, binding), /input hash/);
  } finally {await rm(temp, {recursive: true, force: true});}
});

test('root translation and the source audio opening remain exact', () => {
  const m = composeStageMatrix({a:1,b:0,c:0,d:1,tx:407.45,ty:281.5},{x:300,y:200});
  assert.deepEqual(m,{a:1,b:0,c:0,d:1,e:107.44999999999999,f:81.5});
  assert.equal(packet.audioPlan.audioFirstFrame,15);assert.equal(packet.audioPlan.lastFrame,1006);
});

test('All Lessons reflects 422 registered pages while retaining the shared grade and locked learner route', () => {
  const shared = allLearningLessons().filter(card => card.moduleCode);
  assert.equal(shared.length, 44);
  assert.equal(shared.reduce((sum, card) => sum + card.registeredPageCount, 0), 422);
  const lesson = shared.find(card => card.stableLessonKey === 'shared-alg001-l04');
  assert.equal(lesson.registeredPageCount, base.productBridge.registeredAnimationCount + 1); assert.equal(lesson.activePageCount, 53);
  assert.equal(lesson.grade, null); assert.equal(lesson.href, null);
  assert.equal(lesson.mappingStatus, 'pending');
});
