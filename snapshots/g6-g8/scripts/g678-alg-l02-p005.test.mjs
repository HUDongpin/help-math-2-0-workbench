import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp, mkdir, readFile, writeFile, rm, realpath} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readAlgL2P005Packet, readAlgL2P005Binding, extendAlgL2Descriptor, ALG_L2_P005_ID, ALG_L2_P005_CALIBRATION, ALG_L2_P005_FREEZE} from '../apps/web/lib/g678-alg-l02-p005.server.ts';
import {g678PartialCalibrationSnapshot} from '../apps/web/lib/g678-calibration-product-bridge.server.ts';
import {composeStageMatrix} from './lib/g678-terminal-source-generator-v3.mjs';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';

const root = path.resolve(import.meta.dirname, '..');
const packet = readAlgL2P005Packet(root);
const snapshot = g678PartialCalibrationSnapshot();
assert.equal(snapshot.status, 'ready');
const base = snapshot.descriptors.find(d => d.course.moduleCode === 'ALG001' && d.course.lesson === 2);
const registration = {maturity: 'private-current-js', deploymentScope: 'local-only', calibrationId: ALG_L2_P005_CALIBRATION,
  freezeManifestSha256: ALG_L2_P005_FREEZE.sha256, moduleSha256: packet.entry.artifacts.module.sha256,
  timelineSha256: packet.entry.artifacts.timeline.sha256, runtimeSha256: packet.entry.artifacts.runtime.sha256};

test('one registered source placement is added without changing any other lesson occurrence or gate', () => {
  const descriptor = extendAlgL2Descriptor(base, packet, registration);
  assert.equal(descriptor.pages.length, 58);
  assert.equal(descriptor.productBridge.registeredAnimationCount, base.productBridge.registeredAnimationCount + 1);
  assert.deepEqual(descriptor.productBridge.selectedAnimationIds, descriptor.pages.filter(p => p.rendererAvailability.kind === 'registered').map(p => p.animationId));
  descriptor.pages.forEach((page, i) => {if (i !== 4) assert.deepEqual(page, base.pages[i]);});
  assert.equal(descriptor.pages[4].previousPlacementId, 'shared-alg001-l02-p004');
  assert.equal(descriptor.pages[4].nextPlacementId, 'shared-alg001-l02-p006');
  assert.equal(descriptor.pages[4].rendererAvailability.runtimeQuery.frameDomain, 'sprite-197');
  assert.equal(descriptor.course.courseShellCount, 0);
  assert(Object.values(descriptor.productBridge.acceptanceEffects).every(v => v === false));
  assert.equal(base.pages[4].rendererAvailability.kind, 'unavailable');
});

test('missing, unbound, public, or differently sourced registrations do not enter the descriptor', () => {
  for (const altered of [undefined, {...registration, deploymentScope: 'bundled'}, {...registration, calibrationId: 'another'},
    {...registration, runtimeSha256: '0'.repeat(64)}, {...registration, moduleSha256: '0'.repeat(64)},
    {...registration, timelineSha256: '0'.repeat(64)}, {...registration, freezeManifestSha256: '0'.repeat(64)}]) {
    assert.throws(() => extendAlgL2Descriptor(base, packet, altered), /actual registered module/);
  }
  for (const mutate of [b => {b.course.lesson = 4;}, b => {b.pages[4].source.assetId = 'swf-' + '0'.repeat(64);},
    b => {b.pages[4].globalPageOrdinal = 3;}, b => {b.source.sourceXmlSha256 = '0'.repeat(64);},
    b => {b.pages[4].rendererAvailability = {kind: 'registered', moduleKey: ALG_L2_P005_ID};}]) {
    const altered = structuredClone(base); mutate(altered);
    assert.throws(() => extendAlgL2Descriptor(altered, packet, registration), /ALG_L2_P005_INVALID/);
  }
});

test('an actual changed renderer byte is rejected before an asset can be served', async () => {
  const temp = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-nms-l3-binding-')));
  try {
    const binding = packet.entry.artifacts.runtime, runtime = path.join(temp, binding.path);
    await mkdir(path.dirname(runtime), {recursive: true});
    const bytes = await readFile(path.join(root, binding.path)); await writeFile(runtime, bytes);
    assert(readAlgL2P005Binding(temp, binding).equals(bytes));
    bytes[100] ^= 1; await writeFile(runtime, bytes);
    assert.throws(() => readAlgL2P005Binding(temp, binding), /input hash/);
  } finally {await rm(temp, {recursive: true, force: true});}
});

test('root scale and translation are composed before the exporter translation', () => {
  const root = {a:1.118515014648438,b:0,c:0,d:1.118515014648438,tx:411.8,ty:304.05};
  const internal = {x:300,y:200};
  const m = composeStageMatrix(root,internal);
  assert(Math.abs(m.a*internal.x+m.c*internal.y+m.e-root.tx)<1e-10);
  assert(Math.abs(m.b*internal.x+m.d*internal.y+m.f-root.ty)<1e-10);
  assert(Math.abs(m.a*(internal.x+100)+m.e-523.6515014648438)<1e-10);
  assert.equal(packet.audioPlan.audioFirstFrame,11);
  assert.equal(packet.audioPlan.lastFrame,744);
});

test('All Lessons reflects 422 registered pages while retaining the shared grade and locked learner route', () => {
  const shared = allLearningLessons().filter(card => card.moduleCode);
  assert.equal(shared.length, 44);
  assert.equal(shared.reduce((sum, card) => sum + card.registeredPageCount, 0), 422);
  const lesson = shared.find(card => card.stableLessonKey === 'shared-alg001-l02');
  assert.equal(lesson.registeredPageCount, base.productBridge.registeredAnimationCount + 1); assert.equal(lesson.activePageCount, 58);
  assert.equal(lesson.grade, null); assert.equal(lesson.href, null);
  assert.equal(lesson.mappingStatus, 'pending');
});
