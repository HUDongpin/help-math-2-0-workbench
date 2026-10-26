import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp, mkdir, readFile, writeFile, rm, realpath} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readNmsL1P002Packet, readNmsL1P002Binding, extendNmsL1P002Descriptor, NMS_L1_P002_ID, NMS_L1_P002_CALIBRATION, NMS_L1_P002_FREEZE} from '../apps/web/lib/g678-nms-l01-p002.server.ts';
import {g678PartialCalibrationSnapshot} from '../apps/web/lib/g678-calibration-product-bridge.server.ts';
import {composeStageMatrix} from './lib/g678-nms-l01-p002-generator-v1.mjs';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';

const root = path.resolve(import.meta.dirname, '..');
const packet = readNmsL1P002Packet(root);
const snapshot = g678PartialCalibrationSnapshot();
assert.equal(snapshot.status, 'ready');
const base = snapshot.descriptors.find(d => d.course.moduleCode === 'NMS002' && d.course.lesson === 1);
const registration = {maturity: 'private-current-js', deploymentScope: 'local-only', calibrationId: NMS_L1_P002_CALIBRATION,
  freezeManifestSha256: NMS_L1_P002_FREEZE.sha256, moduleSha256: packet.entry.artifacts.module.sha256,
  timelineSha256: packet.entry.artifacts.timeline.sha256, runtimeSha256: packet.entry.artifacts.runtime.sha256};

test('one registered source placement is added without changing any other lesson occurrence or gate', () => {
  const descriptor = extendNmsL1P002Descriptor(base, packet, registration);
  assert.equal(descriptor.pages.length, 47);
  assert.equal(descriptor.productBridge.registeredAnimationCount, base.productBridge.registeredAnimationCount + 1);
  assert.deepEqual(descriptor.productBridge.selectedAnimationIds, descriptor.pages.filter(p => p.rendererAvailability.kind === 'registered').map(p => p.animationId));
  descriptor.pages.forEach((page, i) => {if (i !== 1) assert.deepEqual(page, base.pages[i]);});
  assert.equal(descriptor.pages[1].previousPlacementId, 'shared-nms002-l01-p001');
  assert.equal(descriptor.pages[1].nextPlacementId, 'shared-nms002-l01-p003');
  assert.equal(descriptor.pages[1].rendererAvailability.runtimeQuery.frameDomain, 'sprite-722');
  assert.equal(descriptor.course.courseShellCount, 0);
  assert(Object.values(descriptor.productBridge.acceptanceEffects).every(v => v === false));
  assert.equal(base.pages[1].rendererAvailability.kind, 'unavailable');
});

test('missing, unbound, public, or differently sourced registrations do not enter the descriptor', () => {
  for (const altered of [undefined, {...registration, deploymentScope: 'bundled'}, {...registration, calibrationId: 'another'},
    {...registration, runtimeSha256: '0'.repeat(64)}, {...registration, moduleSha256: '0'.repeat(64)},
    {...registration, timelineSha256: '0'.repeat(64)}, {...registration, freezeManifestSha256: '0'.repeat(64)}]) {
    assert.throws(() => extendNmsL1P002Descriptor(base, packet, altered), /actual registered module/);
  }
  for (const mutate of [b => {b.course.lesson = 4;}, b => {b.pages[1].source.assetId = 'swf-' + '0'.repeat(64);},
    b => {b.pages[1].globalPageOrdinal = 3;}, b => {b.source.sourceXmlSha256 = '0'.repeat(64);},
    b => {b.pages[1].rendererAvailability = {kind: 'registered', moduleKey: NMS_L1_P002_ID};}]) {
    const altered = structuredClone(base); mutate(altered);
    assert.throws(() => extendNmsL1P002Descriptor(altered, packet, registration), /NMS_L1_P002_INVALID/);
  }
});

test('an actual changed renderer byte is rejected before an asset can be served', async () => {
  const temp = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-nms-l3-binding-')));
  try {
    const binding = packet.entry.artifacts.runtime, runtime = path.join(temp, binding.path);
    await mkdir(path.dirname(runtime), {recursive: true});
    const bytes = await readFile(path.join(root, binding.path)); await writeFile(runtime, bytes);
    assert(readNmsL1P002Binding(temp, binding).equals(bytes));
    bytes[100] ^= 1; await writeFile(runtime, bytes);
    assert.throws(() => readNmsL1P002Binding(temp, binding), /input hash/);
  } finally {await rm(temp, {recursive: true, force: true});}
});

test('root translation and the source audio opening remain exact', () => {
  const m = composeStageMatrix({a:1,b:0,c:0,d:1,tx:360.95,ty:273},{x:300,y:200});
  assert.deepEqual(m,{a:1,b:0,c:0,d:1,e:60.94999999999999,f:73});
  assert.equal(packet.audioPlan.lastFrame,985);assert.deepEqual(packet.audioPlan.segments,[{firstFrame:1,firstDecodedSample:1673,endDecodedSample:734400},{firstFrame:428,firstDecodedSample:734699,endDecodedSample:1759680}]);
});

test('All Lessons reflects 422 registered pages while retaining the shared grade and locked learner route', () => {
  const shared = allLearningLessons().filter(card => card.moduleCode);
  assert.equal(shared.length, 44);
  assert.equal(shared.reduce((sum, card) => sum + card.registeredPageCount, 0), 422);
  const lesson = shared.find(card => card.stableLessonKey === 'shared-nms002-l01');
  assert.equal(lesson.registeredPageCount, base.productBridge.registeredAnimationCount + 34); assert.equal(lesson.activePageCount, 47);
  assert.equal(lesson.grade, null); assert.equal(lesson.href, null);
  assert.equal(lesson.mappingStatus, 'pending');
});

test('three source glossary buttons resolve in both languages without rewriting the existing 22 terms',()=>{
  const d=extendNmsL1P002Descriptor(base,packet,registration);assert.equal(d.glossary.length,23);
  for(const old of base.glossary)assert.deepEqual(d.glossary.find(e=>e.id===old.id),old);
  const numberLine=d.glossary.find(e=>e.id==='number-line');assert.equal(numberLine.labels.en,'Number line');assert.equal(numberLine.labels.es,'Recta numérica');
  assert.equal(numberLine.definitions.en,'A number line is a way to order real numbers by their size. Numbers increase to the right and decrease to the left.');
  assert.equal(numberLine.source.en.sha256,'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b');
  assert.equal(numberLine.source.es.sha256,'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407');
  for(const mutate of [p=>{p.sourceGlossary.entries[0].definitions.en='changed';},p=>{p.sourceGlossary.controls[0].entryId='unknown-term';}]){const changed=structuredClone(packet);mutate(changed);assert.throws(()=>extendNmsL1P002Descriptor(base,changed,registration),/NMS_L1_P002_INVALID/);}
});
